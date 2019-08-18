import React, { Component } from 'react'
import Steps from './Steps'
import CategoryTree from './CategoryTree'
import axios from 'axios'
import lang from '../LanguageSelector'
import * as Scroll from 'react-scroll';
let scroll = Scroll.animateScroll;

class Guide extends Component {
    constructor() {
        super()
        
        this.state = {
            loading : false,
            error : false,
            error_text : false,
            route : '/user-guides',
            header : lang.guide.header,
            history : '',

            post_vars : {
                title : '',
                description : '',
                steps : [
                    { 
                        image : '',
                        text : ''
                    }
                ],
                tips : '',
                difficulty : '1',
                categories : '',
                keywords : '',
                link_url : '',
                link_title : ''
            }
        }

        this.handlePublish = this.handlePublish.bind(this);
        this.handleUpdateSteps = this.handleUpdateSteps.bind(this);
        this.handleUpdateCategories = this.handleUpdateCategories.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        const route = this.state.route;
        const header = this.state.header;
        const history = this.props.history;
        let state = this.state;
        let self = this;

        state.post_vars.id = id;
        state.history = history;

        this.setState(state);

        if (id) {
            axios.get(route+'-ajax/'+id)
            .then(response => {
                console.log(response);
                
                let guide = response.data.guide;
                let steps = response.data.steps;

                for (var key in guide) {
                    state.post_vars[key] = guide[key];
                }

                state.post_vars.categories = response.data.category_id;
                state.post_vars.steps = [];

                for (var key in steps) {
                    state.post_vars.steps.push({ 
                        'text' : steps[key]['step'], 
                        'image' : steps[key]['image']
                    })
                }

                self.setState(state);
            })
            .catch(error => {
                console.log(error);
                history.push({
                    pathname:route,
                    state: { 
                        alert:'danger',
                        alert_text:lang.guide.the + header + lang.guide.notfound
                    }
                })
            })
        }
    }

    axiosThen(id,route,history,header, data) {
        let pathname = '/user-guides';
        this.setState({ loading : false });
        // redirect

        console.log(data);

        if (data.slug) {
            pathname = '/guide/' + data.slug;
        }

        window.location.href = pathname;
    }

    axiosError(error) {
        scroll.scrollToTop({});

        let response_error = lang.guide.error;
        error = JSON.parse(JSON.stringify(error));

        try {
            if (error.response.status == 401 || error.response.status == 419) {
                response_error = lang.guide.login
            } else {
                response_error = error.response.data.errors[Object.keys(error.response.data.errors)[0]];
            }
        } catch(err) {
            console.log(err);
        }

        this.setState({
            error:'danger',
            error_text:response_error,
            loading : false
        })
    }

    handleUpdateSteps(steps) {
        let state = this.state;
        state.post_vars.steps = steps;
        this.setState({ state })
    }

    handleUpdateCategories(category_id) {
        let state = this.state;
        state.post_vars.categories = category_id;
        this.setState(state);
    }

    handlePublish(published, event) {
        event.preventDefault();

        const id = this.state.post_vars.id;
        const route = this.state.route;
        const header = this.state.header;
        const history = this.state.history;
        let post_vars = this.state.post_vars;
        post_vars.published = published;

        this.setState({loading:true});
        console.log(id);

        
        if (id) {
            axios.patch(route + '-ajax/' + id, post_vars)
            .then(response => {
                this.axiosThen(id,route,history,header,response.data)
            })
            .catch(error => {
                this.axiosError(error)
            })
        } else {
            axios.post(route + '-ajax', post_vars)
            .then(response => {
                this.axiosThen(id,route,history,header,response.data)
            })
            .catch(error => {
                this.axiosError(error)
            })
        }
        
    }
    
    handleFieldChange(event) {
        let state = this.state;
        state.post_vars[event.target.name] = event.target.value;
        
        this.setState(state);
    }

    render() {
        return (
            <div className="write">
                <div className="blue-header">
                    <div className="underline"></div>
                    <div className="header">
                        <h2><span>{ lang.guide.new }</span></h2>
                    </div>
                </div>

                <form role="form" method="POST" className="main-second-font">
                    <input type="hidden" defaultValue={ csrf_token } />
                    <div className="grey-box">
                        <div className="row">
                            <div className="col-xs-12 col-lg-6">
                                { 
                                    this.state.error == 'success' ? 
                                    <div className="alert alert-success">{this.state.error_text}</div> : 
                                    null 
                                }
                                { 
                                    this.state.error == 'danger' ? 
                                    <div className="alert alert-danger">{this.state.error_text}</div> : 
                                    null 
                                }

                                <div className="form-group">
                                    <label>{ lang.guide.title }</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        id="title" 
                                        className="form-control" 
                                        tabIndex="1" 
                                        defaultValue={ this.state.post_vars.title } 
                                        placeholder={ lang.guide.titleplace } 
                                        onChange={this.handleFieldChange} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{ lang.guide.description }</label>
                                    <textarea 
                                        name="description" 
                                        id="description" 
                                        className="form-control" 
                                        tabIndex="2" 
                                        placeholder={ lang.guide.descriptionplace } 
                                        value={ this.state.post_vars.description }
                                        onChange={this.handleFieldChange}>
                                    </textarea>
                                </div>

                                <div className="form-group">
                                    <label>{ lang.guide.youtube }</label>
                                    <input 
                                        type="text" 
                                        name="video" 
                                        id="video" 
                                        className="form-control" 
                                        tabIndex="3" 
                                        defaultValue={ this.state.post_vars.video } 
                                        placeholder="https://www.youtube.com/watch?v=xxxxxx" 
                                        onChange={this.handleFieldChange} 
                                    />
                                </div>

                                <Steps 
                                    steps={ this.state.post_vars.steps } 
                                    updateSteps={ this.handleUpdateSteps } 
                                />

                                <div className="form-group">
                                    <label>{ lang.guide.tips }</label>
                                    <textarea 
                                        name="tips" 
                                        id="tips" 
                                        className="form-control" 
                                        tabIndex="4" 
                                        placeholder={ lang.guide.tipsplace } 
                                        value={ this.state.post_vars.tips }
                                        onChange={this.handleFieldChange}
                                    >
                                    </textarea>
                                </div>

                                <div className="form-group">
                                    <label>{ lang.guide.difficulty }</label>
                                    <select 
                                        name="difficulty" 
                                        id="difficulty" 
                                        className="form-control" 
                                        value={ this.state.post_vars.difficulty } 
                                        tabIndex="5"
                                        onChange={this.handleFieldChange}
                                    >
                                        <option value="1">{ lang.guide.beg }</option>
                                        <option value="2">{ lang.guide.inte }</option>
                                        <option value="3">{ lang.guide.ex }</option>
                                    </select>
                                </div>
                                
                                <CategoryTree 
                                    updateCategories={ this.handleUpdateCategories } 
                                    category_id = { this.state.post_vars.categories } />

                                <div className="form-group">
                                    <label>{ lang.guide.keywords }</label>
                                    <input 
                                        type="text" 
                                        name="keywords" 
                                        id="keywords" 
                                        className="form-control" 
                                        tabIndex="7" 
                                        defaultValue={ this.state.post_vars.keywords } 
                                        placeholder={ lang.guide.keyplace }
                                        onChange={this.handleFieldChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{ lang.guide.link_url }</label>
                                    <input 
                                        type="text" 
                                        name="link_url" 
                                        id="link_url" 
                                        className="form-control" 
                                        tabIndex="8" 
                                        defaultValue={ this.state.post_vars.link_url } 
                                        placeholder="http://www.cnn.com" 
                                        onChange={this.handleFieldChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{ lang.guide.link_title }</label>
                                    <input 
                                        type="text" 
                                        name="link_title" 
                                        id="link_title" 
                                        className="form-control" 
                                        tabIndex="9" 
                                        defaultValue={ this.state.post_vars.link_title } 
                                        placeholder={ lang.guide.cnn }
                                        onChange={this.handleFieldChange}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    onClick={ (e) => this.handlePublish(0,e) }
                                    >{ lang.guide.draft }</button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary mr-4 ml-4" 
                                    onClick={ (e) => this.handlePublish(1,e) }>{ lang.guide.publish }</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}

export default Guide
<template>
    <div class="vx-row mb-2 index">
        <div class="vx-col w-full">
            <div slot="header" class="flex flex-wrap-reverse items-center flex-grow justify-between">
                <div class="flex flex-wrap-reverse items-center justify-between w-full">
                    <!-- ADD NEW -->
                    <router-link v-if="!disableadd" :to="`${this.path}/create`" class="p-3 mb-4 mr-4 rounded-lg cursor-pointer flex items-center justify-between text-lg font-medium text-base text-primary border border-solid border-primary">
                        <feather-icon icon="PlusIcon" svgClasses="h-4 w-4" />
                        <span class="ml-2 text-base text-primary">Add New</span>
                    </router-link>
                    <div v-else></div>

                    <filter-index 
                        @filter-applied="handleFilterApplied"
                        @filter-cleared="handleFilterCleared"
                        :filters="filters"
                        :current-filters="filtersValues"
                        ref="FilterIndex"
                        :path="this.axiospath"
                        :translate="translate"
                    >
                    </filter-index>
                </div>
              </div>

            <vs-tabs ref="tabs" :value="selectedTab">
                <vs-tab ref="tab" :label="tab.label" :key="tab.label" v-for="tab in tabs" @click="handleTab(tab)">
                    <div class="tab-text"> 
                        <div v-if="tab.type == 'import_program_csv'">
                            <import-program-csv></import-program-csv>
                        </div>
                        <div v-else>
                            <vs-table ref="table" :data="items" v-if="!loading || items.length">
                                <template slot="thead">
                                    <vs-th :key="field" v-for="(fieldValue, field) in tab.fields">
                                        <a class="flex items-center cursor-pointer" @click="handleSort(field)">
                                            <span class="sort-th relative">
                                                <i class="material-icons up-sort">expand_less</i>
                                                <i class="material-icons down-sort">expand_more</i>
                                            </span>
                                            
                                            <span v-if="typeof fieldValue === 'object'">{{ fieldValue.label }}</span>
                                            <span v-else>{{ fieldValue }}</span>
                                        </a>
                                    </vs-th>
                                </template>

                                <template :slot-scope="{data}">
                                    <tbody>
                                        <vs-tr :key="trindex" v-for="(item,trindex) in items" :class="clickClass(tab.disable_click)">
                                            <vs-td :key="field" v-for="(fieldValue, field) in tab.fields" @click.native="handleClickItem(item,tab.disable_click)">
                                                <router-link v-if="field==idfield" :to="`${path}/${item.id}`" v-text="item[field]"></router-link>
                                                <div v-if="field == 'picture'" class="img-container">
                                                    <vs-avatar size="50px" v-if="item[field]" class="product-img" :src="`/${item['filefolder']}${item[field]}`" />
                                                    <vs-avatar size="50px" v-else class="product-img" src="/images/no-profile.png" />
                                                </div>
                                                <div v-else-if="Array.isArray(item[field])">
                                                    <div v-if="item[field].length">
                                                        <vs-dropdown class="">
                                                          <a class="a-icon" href.prevent>
                                                            {{ fieldValue }}
                                                            <i class="material-icons">
                                                            expand_more
                                                            </i>
                                                          </a>

                                                          <vs-dropdown-menu>
                                                            <vs-dropdown-item :key="i" v-for="(dItem,i) in item[field]" v-text="dItem"></vs-dropdown-item>
                                                          </vs-dropdown-menu>
                                                        </vs-dropdown>
                                                    </div>
                                                </div>
                                                <div v-else-if="typeof fieldValue === 'object'">
                                                    <template v-if="fieldValue.type == 'button'">
                                                        <vs-button 
                                                            class="custom-index-button"
                                                            :color="fieldValue.options ? fieldValue.options[item[field]]['color'] : fieldValue.color" 
                                                            :type="fieldValue.button_type" 
                                                            :icon="fieldValue.options ? fieldValue.options[item[field]]['icon'] : fieldValue.icon"
                                                            @click.stop="handleCustomButtonClick(item['id'],field)">
                                                        </vs-button>
                                                    </template> 
                                                </div>
                                                <span v-else v-html="translateValue(field,item[field])"></span>
                                            </vs-td>
                                        </vs-tr>
                                    </tbody>
                                </template>
                            </vs-table>
                        </div>
                    </div>
                </vs-tab>
            </vs-tabs>
            <div class="flex items-center loading-wrapper">
                <div v-show="loading" id="abc" class="vs-con-loading__container loading-animation"></div>
            </div>
        </div>
    </div>
</template>

<script>
    import dateFns from 'date-fns';
    import FilterIndex from './FilterIndex';
    
    export default {
        props: {
            singular : String,
            idfield : String,
            translate : Object,
            filters : Object,
            tabs : Array,
            defaultsort : String,
            defaultsortdir : String,
            path : String,
            notsortable : Array,
            disableadd : Boolean,
        },
        components : { 
            FilterIndex
        },
        data() {
            return {
                items: [],
                filtering : false,
                filtersValues : {},
                sort : 'updated_at',
                sortDir : 'desc',
                currentPage : 1,
                loading : false,
                axiospath : false,
                selectedTab : 0,
                error : false,
            }
        },
        mounted() {
            this.$vs.loading({
                container: '#abc',
                type : 'radius'
            })
        },
        computed: {
            pageTitle: {
                get() {
                    return this.$store.state.titleHeader;
                },
                set(val) {
                    this.$store.dispatch('updateTitle', val);
                }
            },
            totalFound: {
                get() {
                    return this.$store.state.totalFound;
                },
                set(val) {
                    this.$store.dispatch('updateTotalFound', val);
                }
            },
            indexSettings: function() {
                return this.$store.state.indexSettings
            },
            indexSettingsTab: function() {
                return this.$store.state.indexSettings[this.path]['tab'];
            },
            indexSettingsFilters: function() {
                return this.$store.state.indexSettings[this.path]['filters'];
            },
            indexSettingsSort: function() {
                return this.$store.state.indexSettings[this.path]['sort'];
            },
            indexSettingsSortDir: function() {
                return this.$store.state.indexSettings[this.path]['sort_dir'];
            }
        },
        created() {  
            this.axiospath = this.tabs[0].axiospath;
            this.sort = this.defaultsort;
            this.sortDir = this.defaultsortdir;
            window.addEventListener('scroll', this.handleScroll);
            let uri = this.axiospath + '?page=' + this.currentPage;

            if (this.indexSettings.hasOwnProperty(this.path)) {
                if (this.indexSettingsTab) {
                    this.axiospath = this.indexSettingsTab;
                    this.tabs.forEach((tab, i) => {
                        if (tab.axiospath == this.indexSettingsTab) {
                            this.selectedTab = i;
                        }
                    });
                }
                
                this.filtersValues = this.indexSettingsFilters ? this.indexSettingsFilters : {};
                this.sort = this.indexSettingsSort ? this.indexSettingsSort : 'updated_at';
                this.sortDir = this.indexSettingsSortDir ? this.indexSettingsSortDir : 'desc';
                uri = this.axiospath + '?filters=' + JSON.stringify(this.filtersValues) + '&sort=' + this.sort + '&sort_dir=' + this.sortDir;
            }

            this.getItems(uri,false);
        },
        destroyed () {
            window.removeEventListener('scroll', this.handleScroll);
        },
        methods : {
            setIndexSettings() {
                this.$store.dispatch('saveIndexSettings', { 
                    path: this.path, 
                    tab: this.axiospath, 
                    filters: this.filtersValues, 
                    sort: this.sort, 
                    sort_dir: this.sortDir 
                } );
            },
            handleCustomButtonClick(id, field) {
                this.$emit('custom-button', id, field);
            },
            clickClass(disableClick) {
                if (!disableClick) {
                    return 'cursor-pointer';
                }
            },
            handleClickItem(item,disableClick) {
                if (!disableClick) {
                    this.$router.push({ path: `${this.path}/${item.id}/edit` });    
                }
            },
            handleTab(tab) {
                this.loading = true;
                this.items = [];
                let uri = tab.axiospath;
                this.axiospath = tab.axiospath;
                this.$refs.FilterIndex.clear();
                this.setIndexSettings();
            },
            getItems(uri,add = false) {
                this.loading = true;
                this.totalFound = false;
                if (!this.error) {
                    axios.get(uri).then(response => {
                        if (add) {
                            this.items = this.items.concat(response.data.data);    
                        } else {
                            this.items = response.data.data;
                        }

                        if (response.data.next_page_url) {
                            let nextPage = response.data.next_page_url.match(/page=(.*)/)[1];
                            this.currentPage = nextPage ? nextPage : null;    
                        } else {
                            this.currentPage = null;
                        }

                        if (response.data.total) {
                            this.totalFound = response.data.total;
                        }
                        
                        this.loading = false;
                    }).catch(e => {
                        let error;
                        if (e.response.status == '403') {
                            error = 'You don\'t have access to this section';
                        } else {
                            error = 'An error had occurred';
                        }
                        this.loading = false;
                        this.error = e;
                        this.$vs.notify({
                            title:'Error',
                            text: error,
                            color: 'danger',
                            iconPack: 'feather',
                            icon:'icon-x'});
                        console.log('could not get results', e);
                    });
                }
            },
            handleSort(field) {
                let continueSort = true;
                if (this.notsortable && this.notsortable.length) {
                    this.notsortable.forEach(notSortableField => {
                        if (field == notSortableField) {
                            continueSort = false;
                        }
                    })
                }

                if (continueSort) {
                    this.items = [];
                    this.sort = field;
                    this.sortDir = this.sortDir == 'desc' ? 'asc' : 'desc';
                    this.setIndexSettings();
                    let uri = this.axiospath + '?filters=' + JSON.stringify(this.filtersValues) + '&sort=' + this.sort + '&sort_dir=' + this.sortDir;
                    this.getItems(uri, false);
                }
            },
            handleFilterApplied(filtersValues) {
                this.items = [];
                this.filtering = true;
                this.filtersValues = filtersValues;
                let uri = this.axiospath + '?filters=' + JSON.stringify(this.filtersValues);
                this.getItems(uri, false);

                this.setIndexSettings();
            },
            handleFilterCleared() {
                this.items = [];
                this.filtering = false;
                this.filtersValues = {};
                let uri = this.axiospath;
                this.getItems(uri, false);
            },
            translateValue(field,value) {
                if (Object.keys(this.translate).indexOf(field) !== -1) {
                    return this.translate[field][value];    
                } else if (field == 'created_at' || field == 'updated_at' || field == 'date_created' || field == 'lastupdated' || field == 'searchdate' || field == 'time_status_edited') {
                    return dateFns.format(value, 'MM/DD/YYYY')
                } else if (field=='date_of_interview') {
                    return dateFns.format(value, 'MM/DD/YYYY')
                } else {
                    return value;      
                }
            },
            handleScroll () {
                if (document.body.scrollHeight <= 
                    window.scrollY +        
                    window.innerHeight + 580 && !this.loading) {
                    if (this.currentPage) {
                        let uri = this.axiospath + '?filters=' + JSON.stringify(this.filtersValues) + '&sort=' + this.sort + '&sort_dir=' + this.sortDir + '&page=' + this.currentPage;
                        this.getItems(uri, true);    
                    }
                }
            }
        }
    }
</script>

<style lang="scss">
    .index .custom-index-button .vs-icon {
            position: relative;
            top: -2px;
    }
    .loading-wrapper,.loading-animation {
        height:100px; 
        width:100%;
    }
    .con-vs-loading {
        background:none;
    }
    .vs-dropdown--item {
        padding: 3px;
    }
    .vs-con-table {
        .vs-table--header {
          display: flex;
          flex-wrap: wrap-reverse;
          margin-left: 1.5rem;
          margin-right: 1.5rem;
          > span {
            display: flex;
            flex-grow: 1;
          }

          .vs-table--search{
            padding-top: 0;

            .vs-table--search-input {
              padding: 0.9rem 2.5rem;
              font-size: 1rem;

              &+i {
                left: 1rem;
              }

              &:focus+i {
                left: 1rem;
              }
            }
          }
        }

        .vs-table {
          border-collapse: separate;
          border-spacing: 0 1.3rem;
          padding: 0 1rem;

          tr{
              box-shadow: 0 4px 20px 0 rgba(0,0,0,.05);
              td{
                padding: 10px;
                &:first-child{
                  border-top-left-radius: .5rem;
                  border-bottom-left-radius: .5rem;
                }
                &:last-child{
                  border-top-right-radius: .5rem;
                  border-bottom-right-radius: .5rem;
                }
                .parent-dropdown i {
                    top: 7px;
                    position: relative;
                }
                .img-container {
                  // width: 1rem;
                  // background: #fff;

                  span {
                    width:110px;
                    overflow:hidden;
                    display: flex;
                    justify-content: center;
                  }

                  .product-img {
                    height: 110px;
                  }
                }
              }
              td.td-check{
                padding: 20px !important;
              }
          }
        }

        .vs-table--thead{
          th {
            padding-top: 0;
            padding-bottom: 0;

            .vs-table-text{
              text-transform: uppercase;
              font-weight: 600;
            }
          }
          th.td-check{
            padding: 0 15px !important;
          }
          tr{
            background: none;
            box-shadow: none;
          }
        }

        .vs-table--pagination {
          justify-content: center;
        }
  }
</style>
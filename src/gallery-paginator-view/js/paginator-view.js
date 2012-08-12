/**
 * @module paginator-view
 * @version 1.0.1
 * @author Todd Smith
 * @since 3.6.0
 */


/**
 A Model infrastructure element to be used to track pagination state of a paged set of control elements.
 For example, can be used to track the pagination status of a DataTable where the user selects limited
 portions for display, against a larger data set.

 The primary tools for maintaining "page state" is through the following attributes;
    <br/>&nbsp;&nbsp;&nbsp;    `totalItems` &nbsp;&nbsp;  Which represents the "Total count of items of interest" (See attribute [totalItems](#attr_totalItems) )
     <br/>&nbsp;&nbsp;&nbsp;   `itemsPerPage` &nbsp;&nbsp; Which represents the "Count of items on each page" (See attribute [itemsPerPage](#attr_itemsPerPage) )
     <br/>&nbsp;&nbsp;&nbsp;   `page` &nbsp;&nbsp;  The currently selected page, within all pages required that encompass the above two attributes (See attribute [page](#attr_page) )

 Example;

        // setup a paginator model for 500 'foo' items, paged at 50 per page ...
        var pagModel = new Y.PaginatorModel({
            totalItems:     500,
            itemsPerPage:   50
        });
        pagModel.get('totalPages');  // returns 10

        pagModel.set('page',3);
        pagModel.getAttrs(['lastPage','page','itemIndexStart','itemIndexEnd']);
        // returns ... { lastPage:1, page:3, itemIndexStart:100, itemIndexEnd:149 }


 @class Y.PaginatorModel
 @extends Y.Model
 @version 1.0.1
 @since 3.6.0
**/
Y.PaginatorModel = Y.Base.create('paginatorModel', Y.Model,[],{

    /**
     * Placeholder for calculated # of pages required
     *
     * @property _npages
     * @type {Number}
     * @protected
     */
    _npages: null,

    /**
     * Placeholder for Event subscribers created by this model, kept for detaching on destroy.
     *
     * @property _subscr
     * @type {Array}
     * @protected
     */
    _subscr: null,

    /**
     * Creates self-listeners to recalculate paginator settings on items / itemsPerPage
     *  changes.  Also sets listener to track 'lastPage' changes.
     *
     * @method initializer
     * @private
     * @return this
     */
    initializer: function(){

        this._recalcPagnParams();

        this._subscr = [];
        this._subscr.push( this.after('totalItemsChange',this._recalcPagnParams) );
        this._subscr.push( this.after('itemsPerPageChange',this._recalcPagnParams) );

        this._subscr.push( this.on('pageChange', this._changePage) );

        return this;
    },

    /**
     * Default destructor method, cleans up the listeners that were created.
     *
     * @method destructor
     * @private
     */
    destructor: function () {
        Y.Array.each(this._subscr,function(item){
            item.detach();
        });
        this._subscr = null;
    },

    /**
     * Method responds to changes to "page" (via `pageChange` attribute change), validates the change compared to the
     *  current paginator settings, and stores the prior page in "lastPage".
     *
     * If a page change is invalid (i.e. less than 1, non-numeric or greater than `totalPages` the change is prevented.
     *
     * @method _changePage
     * @param {EventHandle} e
     * @return Nothing
     * @private
     */
    _changePage: function(e) {
        var newPg = e.newVal,
            validp = true;

        if ( newPg < 1 || !this.get('totalPages') || !this.get('itemsPerPage') ) validp = false;
        if ( this.get('totalPages') && newPg > this.get('totalPages') ) validp = false;

        if (validp)
            this.set('lastPage', e.prevVal);
        else
            e.preventDefault();
    },

    /**
     * Method to calculate the current paginator settings, specifically the
     *  number of pages required, including a modulus calc for extra records requiring a final page.
     *
     * This method resets the `page` to 1 (first page) upon completion.
     *
     * @method _recalcPagnParams
     * @return {Boolean} Indicating the "success" or failure of recalculating the pagination state.
     * @private
     */
    _recalcPagnParams: function(){
        var nipp = this.get('itemsPerPage'),
            ni   = this.get('totalItems');

        if ( ni && nipp && ni > 0 && nipp > 0 ) {
            np = Math.floor( ni / nipp );
            if ( ni % nipp > 0 ) np++;
            //this.set('totalPages',np);
            this._npages = np;
            this.set('page',1);
            return true;
        }
        return false;
    },

    /**
     * Getter for returning the start index for the current `page`
     * @method _getItemIndexStart
     * @return {Integer} Index of first item on the current `page`
     * @private
     */
    _getItemIndexStart: function() {
        return ( this.get('page') - 1 ) * this.get('itemsPerPage');
    },

    /**
     * Getter for returning the ending index for the current `page`
     * @method _getItemIndexEnd
     * @return {Integer} Index of the last item on the current `page`
     * @private
     */
    _getItemIndexEnd: function(){
        var ni   = this.get('totalItems'),
            iend = this.get('itemIndexStart') + this.get('itemsPerPage');
        return ( iend > ni ) ? ni : iend;
    }

},{
    ATTRS:{

        /**
         * Total number of items used by this paginator-model.
         *
         * @attribute totalItems
         * @type {Integer}
         * @default null
         */
        totalItems:        {
            value:      null,
            validator:  Y.Lang.isNumber
        },

        /**
         * Number of items per page for this paginator.
         *
         * @attribute itemsPerPage
         * @type {Integer}
         * @default null
         */
        itemsPerPage :   {
            value:      null,
            validator:  Y.Lang.isNumber
        },

        /**
         * The current page selected for this paginator-model.
         *
         * This is intended as the **primary** change parameter to be .set() by the user, for interacting
         * with the Paginator Model.
         *
         * @attribute page
         * @type {Integer}
         * @default 1
         */
        page:    {
            value:      1,
            validator:  Y.Lang.isNumber
        },

        /**
         * The last active `page` that was selected, this is populated by a `pageChange` listener on the Model.
         *
         * @attribute lastPage
         * @type {Integer}
         * @default null
         */
        lastPage: {
            value:      null,
            validator:  Y.Lang.isNumber
        },

        /**
         * The total number of pages required to complete this pagination state (based upon `totalItems` and
         * `itemsPerPage`, specifically).
         *
         * This attribute is set / maintained by the method [_recalcPagnParams](#method__recalcPagnParams) and
         * shouldn't be set by the user.
         *
         * @attribute totalPages
         * @type Integer
         * @default null
         */
        totalPages: {
            value:      null,
            validator:  Y.Lang.isNumber,
            getter:     function(){ return this._npages; }
        },

        /**
         * The index for the starting item on the current `page` within the pagination state.
         *
         * This attribute is calculated on the fly in a getter method [_getItemIndexStart](#method__getItemIndexStart) and
         * should not be "set" by the user, as it will be disregarded.
         *
         * @attribute itemIndexStart
         * @type Integer
         * @default null
         */
        itemIndexStart: {
            value :     null,
            validator:  Y.Lang.isNumber,
            getter:     '_getItemIndexStart'
        },

        /**
         * The index for the ending item on the current `page` within the pagination state.
         *
         * This attribute is calculated on the fly in a getter method [_getItemIndexEnd](#method__getItemIndexEnd) and
         * should not be "set" by the user, as it will be disregarded.
         *
         * @attribute itemIndexEnd
         * @type Integer
         * @default null
         */
        itemIndexEnd: {
            value :     null,
            validator:  Y.Lang.isNumber,
            getter:     '_getItemIndexEnd'
        }
    }

});



/**
 A View infrastructure element to serve as a User Interface for the tracking of "pagination state" of
 a set of data.  This PaginatorView was specifically designed to work with PaginatorModel
 serving as the "model" (in MVC parlance), although would work with any user-supplied model under conditions
 that similar attributes and attribute changes are mapped.

 The PaginatorView was originally designed to function with DataTable (See Y.DataTable.Paginator) for managing the UI
 and page state of paginated tables, although it isn't necessarily limited to that application.  This View responds to
 the model's attribute `xxxxChange` events and updates the UI accordingly.

 The PaginatorView utilizes an HTML template concept, where certain replaceable tokens uniquely related to this view,
 in addition to all of the model's attributes, can be defined for positioning within the Paginator container.


 Example;

        // Setup a paginator view based on a data model for 500 items, paged at 50 per page ...
        var pagView = new Y.PaginatorView(
            container:  '#myPagDIV',
            paginatorTemplate:  '#script-tmpl-mypag',
            model:  new Y.PaginatorModel({
                totalItems:     500,
                itemsPerPage:   50
            })
        }).render();


 @class Y.PaginatorView
 @extends Y.View
 @version 1.0.1
 @since 3.6.0
 **/
Y.PaginatorView = Y.Base.create('paginatorView', Y.View, [], {


//================   S T A T I C     P R O P E R T I E S     ====================

    /**
    Default HTML content to be used as basis for Paginator.  This default is only used if the paginatorTemplate
    attribute is unused OR the container does not contain the HTML template.

    The paginator HTML content includes replacement tokens throughout.

    The DEFAULT setting is;

            <a href="#" data-pglink="first" class="{pageLinkClass}" title="First Page">First</a> |
            <a href="#" data-pglink="prev" class="{pageLinkClass}" title="Prior Page">Prev</a> |
            {pageLinks}
            | <a href="#" data-pglink="next" class="{pageLinkClass}" title="Next Page">Next</a> |
            <a href="#" data-pglink="last" class="{pageLinkClass}" title="Last Page">Last</a>

    @property TMPL_PAGINATOR
    @type String
    **/

    TMPL_PAGINATOR :  '<a href="#" data-pglink="first" class="{pageLinkClass}" title="First Page">First</a> | '
        + '<a href="#" data-pglink="prev" class="{pageLinkClass}" title="Prior Page">Prev</a> | '
        + '{pageLinks}'
        + ' | <a href="#" data-pglink="next" class="{pageLinkClass}" title="Next Page">Next</a> | '
        + '<a href="#" data-pglink="last" class="{pageLinkClass}" title="Last Page">Last</a>',

    /**
     Default HTML content that will be used to prepare individual links within the Paginator and inserted
     at the location denoted **{pageLinks}** replacement token in the template.

     The DEFAULT setting is;

            <a href="#" data-pglink="{page}" class="{pageLinkClass}" title="Page {page}">{page}</a>

     @property TMPL_LINK
     @type {String}
     **/
    TMPL_LINK : '<a href="#" data-pglink="{page}" class="{pageLinkClass}" title="Page {page}">{page}</a>',

    TMPL_basic : '{firstPage} {prevPage} {pageLinks} {nextPage} {lastPage}',


    TMPL_pglinks:   '{pageLinks}',

    /**
     Default HTML template for the Rows Per Page SELECT box signified by the **{selectRowsPerPage}** replacement toke
     within the paginator template.

     The DEFAULT setting is;

            <select class="{selectRPPClass}"></select>

     @property TMPL_selectRPP
     @type String
     **/
    TMPL_selectRPP:  '<select class="{selectRPPClass}"></select>',

    /**
     Default HTML template for the Page SELECT box signified by the **{selectPage}** replacement token with the
     paginator template.

     The DEFAULT setting is;

            <select class="{selectPageClass}"></select>

     @property TMPL_selectPage
     @type String
     **/
    TMPL_selectPage: '<select class="{selectPageClass}"></select>',

    /**
     Default HTML template for the "Rows Per Page" INPUT[text] control signified by the **{inputRowsPerPage}** replacement
     token within the paginator template.

     The DEFAULT setting is;

            <input type="text" class="{inputRPPClass}" value="{itemsPerPage}"/>

     @property TMPL_inputRPP
     @type String
     **/
    TMPL_inputRPP:   '<input type="text" class="{inputRPPClass}" value="{itemsPerPage}"/>',

    /**
     Default HTML template for the "Page" INPUT[text] control signified by the **{inputPage}** replacement token with the
     paginator template.

     The DEFAULT setting is;

            <input type="text" class="{inputPageClass}" value="{page}"/>

     @property TMPL_inputPage
     @type String
     **/
    TMPL_inputPage:  '<input type="text" class="{inputPageClass}" value="{page}"/>',


    /**
     A public property, provided as a convenience property, equivalent to the "model" attribute.

     @property model
     @type Y.PaginatorModel
     @default null
     @public
     **/
    model: null,

//================   P R I V A T E    P R O P E R T I E S     ====================

    /**
     * Placeholder property to store the initial container HTML for used later in the
     *  render method.  This property is populated by the View initializer.
     *
     * @property _pagHTML
     * @protected
     */
    _pagHTML:       null,

    /**
     * Class placeholders for UI elements
     *
     */
    _cssPre:            'yui3-pagview',
    _classContainer:    null,
    _classLinkPage:     null,
    _classLinkPageList: null,
    _classLinkPageActive: null,
    _classSelectRPP:    null,
    _classSelectPage:   null,
    _classInputRPP:     null,
    _classInputPage:    null,


    /**
     * Holder for Event subscribers created by this View, saved so they can be cleaned up later.
     *
     * @property _subscr
     * @type Array
     * @default null
     * @protected
     */
    _subscr: null,


    /**
     * Helper function, because I was too lazy to figure out how to get widget getClassName working
     *
     * @method _myClassName
     * @param String variable number of strings, to be concatenated
     * @return String
     * @private
     */
    _myClassName: function() {
        if (arguments && arguments.length>0) {
            var rtn = this._cssPre;
            for(var i=0; i<arguments.length; i++)
                rtn += '-' + arguments[i];
            return rtn;
        }
        return '';
    },

    /**
     * Initializer sets up classes and the initial container and HTML templating for this View.
     *
     * @method initializer
     * @private
     * @return this
     */
    initializer: function(){
        //
        //  Init class names
        //
        this._classContainer  = this._myClassName('container');
        this._classLinkPage   = this._myClassName('link','page');
        this._classLinkPageList = this._myClassName('link','page','list');
        this._classLinkPageActive  = this._myClassName('link','page','active');
        this._classInputPage  = this._myClassName('input','page');
        this._classSelectPage = this._myClassName('select','page');
        this._classSelectRPP  = this._myClassName('select','rowsperpage');
        this._classInputRPP   = this._myClassName('input','rowsperpage');

    //
    //  Setup the container for the paginator, and retrieve the "HTML template"
    //    from any of the following in order;
    //      (a) the "container" HTML,
    //      (b) user specified template via 'paginatorTemplate' attribute,
    //      (c) finally, the default internal template via valueFn.
    //
        var cont = this.get('container');
        if (Y.Lang.isString(cont) && pagTmpl[0] === '#' )
            this.set('container', Y.one(cont) );

        cont = this.get('container');
        if ( cont instanceof Y.Node && cont.getHTML() ) {

            this._pagHTML = cont.getHTML();

        } else if ( cont instanceof Y.Node && this.get('paginatorTemplate') ) {

            var pagTmpl = this.get('paginatorTemplate');

            // is user-supplied setting, but they forgot to convert via Y.one().getHTML,
            //  do it for them ...
            if ( pagTmpl && pagTmpl[0] === '#' )
                this._pagHTML = Y.one( pagTmpl).getHTML();
            else if ( pagTmpl )
                this._pagHTML = pagTmpl;
        }

        //
        // Setup the container and model listeners
        //
        this._bindUI();

        return this;
    },


    /**
     * Setup listeners on this View, specifically on all UI elements and
     *  "most importantly", listen to "pageChange" on the underlying Model.
     *
     * @method _bindUI
     * @return this
     * @private
     */
    _bindUI: function(){
        var pag_cont =  this.get('container');
        this._subscr = [];

        //
        // Set a listener on the Model change events ... page most important!
        //
        if ( this.get('model') ) {
            this.model = this.get('model');
            this._subscr.push( this.model.after('pageChange', Y.bind(this._modelPageChange,this)) );
            this._subscr.push( this.model.after('itemsPerPageChange', Y.bind(this._modelStateChange,this)) );
            this._subscr.push( this.model.after('totalItemsChange', Y.bind(this._modelStateChange,this)) );
        }

        // update rowOptions
        this._subscr.push( this.after('render', Y.bind(this._updateRPPSelect,this)) );

        // delegate container events, done here instead of "events" property to give more flexibility
        this._subscr.push( pag_cont.delegate( 'click',  this._clickChangePage,'.'+this._classLinkPage, this) );
        this._subscr.push( pag_cont.delegate( 'change', this._selectChangeRowOptions, '.'+this._classSelectRPP, this) );
        this._subscr.push( pag_cont.delegate( 'change', this._inputChangePage, '.'+this._classInputPage, this) );
        this._subscr.push( pag_cont.delegate( 'change', this._selectChangeRowOptions, '.'+this._classInputRPP, this) );

        // after rendering and/or, resize if required ...
        this._subscr.push( this.after(['render','pageChange'], this._resizePaginator) );

        return this;
    },


    /**
     * Default destructor method, cleans up the listeners that were created and
     *  cleans up the view contents.
     *
     * @method destructor
     * @private
     */
    destructor: function () {
        Y.Array.each(this._subscr,function(item){
            item.detach();
        });
        this._subscr = null;
    },


    /**
     Renders the current settings of the Paginator using the supplied HTML content from the
     for the paginator template and Y.Lang.sub for replacement of tokens and of Model attributes.

     NOTE: The render method is not called on every page "click", but is called if the Model changes
     "totalItems" or "itemsPerPage".

     This method fires the "render" event, for View listeners.

     @method render
     @public
     @returns this
     **/
   render: function() {
        var pag_cont = this.get('container'),
            model    = this.get('model'),
            nsize    = model.get('totalItems'),
            nperpage = model.get('itemsPerPage'),
            npage    = model.get('totalPages'),
            cpage    = model.get('page') || 1;

       if ( !nsize || !nperpage || !pag_cont ) return this;

        //
        //  Constructing the Paginator HTML,
        //      first construct the individual Page links ...
        //
        var pl_html   = '',
            plinkTMPL = this.get('pageLinkTemplate'), // || this.TMPL_LINK;
            plIStart  = 0,
            plIEnd    = 0;

        // ... only burn thru this if the token is included in template ...
        if ( this._pagHTML.search(/{pageLinks}/) !== -1 ) {
            for(var i=0; i<npage; i++) {
                plClass = this._classLinkPage + ' ' + this._classLinkPageList;  //plItemCSS;
                if ( i+1 === cpage )
                    plClass += ' '+ this._classLinkPageActive; //this._cssActivePage;

                plIStart = i*nperpage + 1,
                plIEnd   = plIStart + nperpage - 1;
                if ( plIEnd >= nsize ) plIEnd = nsize;

                pl_html += Y.Lang.sub( plinkTMPL, {
                    page:           (i+1),
                    pageLinkClass:  plClass || '',
                    pageStartIndex: plIStart,
                    pageEndIndex:   plIEnd
                });
            }
        }

    // ... then build the full HTML
        var pg_html = this._pagHTML;
        pag_cont.setStyle('visibility','hidden');
        pag_cont.setHTML('');         //pag_cont.empty();

    // and load it into the container
        pg_html = '<div class="{pagClass}" tabindex="-1">' + pg_html + '</div>';
        var plink_tmpl = Y.substitute( pg_html, Y.mix({
            pageLinks:          pl_html || '',
            pageLinkClass:      this._classLinkPage,
            pagClass:           this._classContainer,
            selectRowsPerPage:  this.TMPL_selectRPP || '',
            selectPage:         this.TMPL_selectPage || '',
            inputPage:          this.TMPL_inputPage || '',
            inputRowsPerPage:   this.TMPL_inputRPP || '',
            selectRPPClass:     this._classSelectRPP,
            selectPageClass:    this._classSelectPage,
            inputRPPClass:      this._classInputRPP,
            inputPageClass:     this._classInputPage
        },model.getAttrs()),null,true);

        pag_cont.append(plink_tmpl);

    //
    //  Turn the View visibility on, and set the initial page
    //
        pag_cont.setStyle('visibility','');

        this._processPageChange(cpage);

        this.fire('render');

        return this;
    },


    /**
     * Main handler that accomodates Page changes, updates visual cues for highlighting
     *  the selected page link and the active Page selector link list.
     *
     * This method also fires the View's "pageChange" event.
     *
     * NOTE: This method is *private* because page changes should be made by the user at
     * the Model level (Model.set('page',...) and not using the _processPageChange method.
     *
     * @method _processPageChange
     * @param cpage
     * @private
     */
    _processPageChange: function(cpage) {
        var model      = this.get('model'),
            npage      = model.get('totalPages'),
            lastPage   = model.get('lastPage'),
            maxpls     = this.get('maxPageLinks'),
            pag_cont   = this.get('container'),
            linkOffset = this.get('linkListOffset'),
            plNodes    = pag_cont.all('.'+ this._classLinkPageList);  //this._cssPageLinkItems) : null;

        //
        //  Toggle highlighting of active page selector (if enabled)
        //
        if ( plNodes && this.get('linkHighLight') ) {

            var plNodeCurrent = (plNodes && (cpage-1) < plNodes.size()) ? plNodes.item(cpage-1) : null;
            // this check is only for visual elements that have pageLinks
            //   (i.e. paginator bar won't have these )
            if ( plNodeCurrent )
                plNodeCurrent.addClass( this._classLinkPageActive );
            if ( lastPage && lastPage !== cpage ) {
                plNodeCurrent = (plNodes && (lastPage-1) < plNodes.size()) ? plNodes.item(lastPage-1) : null;
                if (plNodeCurrent) plNodeCurrent.removeClass( this._classLinkPageActive );
            }
        }

        // Update INPUT Page # field, if defined ...
        if ( pag_cont.one('.'+this._classInputPage) ) {
            pag_cont.one('.'+this._classInputPage).set('value',cpage);
        }

        // Update SELECT Items Per Page # field, if defined ...
        if ( pag_cont.one('.'+this._classInputRPP) ) {
            pag_cont.one('.'+this._classInputRPP).set('value',model.get('itemsPerPage'));
        }

        //
        //  Toggle "disabled" on First/Prev or Next/Last selectors
        //
        if ( cpage === 1 && !this.get('circular') ) {

            this._disablePageSelector(['first','prev']);
            this._disablePageSelector(['last','next'],true);

        } else if ( cpage === npage && !this.get('circular') ) {

            this._disablePageSelector(['first','prev'],true);
            this._disablePageSelector(['last','next']);

        } else   // enable all selectors ...
            this._disablePageSelector(['first','prev','last','next'],true);

         this.fire('pageChange',{state: model.getAttrs() });

    //
    //  Following code is only if user requests limited pageLinks,
    //    Only continue if partial links are requested ...
    //
        if ( npage <= maxpls || !plNodes || ( plNodes && plNodes.size() ==0 ) ) return;

        var moreNodeL  = Y.Node.create('<span class="'+this._myClassName('more')+'">'+this.get('pageLinkFiller')+'</span>'),
            moreNodeR  = Y.Node.create('<span class="'+this._myClassName('more')+'">'+this.get('pageLinkFiller')+'</span>');

        // Clear out any old remaining 'more' nodes ...
        pag_cont.all('.'+this._myClassName('more')).remove();

        // determine offsets either side of current page
        var offs = this._calcOffset(cpage,linkOffset);

        //
        // Hide all page # links outside of offsets ...
        //
        plNodes.each(function(node,index){
            if ( index == 0 && this.get('alwaysShowFirst') || index == npage-1 && this.get('alwaysShowLast') ) return true;
            if ( index+1 < offs.left || index+1 > offs.right )
                node.addClass( this._myClassName('hide') );
            else
                node.removeClass( this._myClassName('hide') );
        },this);

        //
        //  add the node either side of current page element PLUS offset
        //
        //var oleft =
        if ( offs.left - linkOffset > 0 )
            plNodes.item(offs.left-1).insert(moreNodeL,'before');

        if ( offs.right + linkOffset <= npage )
            plNodes.item(offs.right-1).insert( moreNodeR,'after');

        return true;

    },

    /**
     * Helper method to calculate offset either side of Selected Page link
     *  for abbreviated Page List.
     *
     *  Called by _processPageChange
     *
     * @method _calcOffset
     * @param cpage {Integer} Current page number
     * @param offset {Integer} Number of links both sides of page number to return for (usually 1)
     * @return {Object} containing left {Integer} and right {Integer} properties
     * @private
     */
    _calcOffset: function(cpage, offset) {
        var npage     = this.get('model').get('totalPages'),
            left_off  = ( cpage-offset < 1 ) ? 1 : (cpage-offset),
            right_off = ( cpage+offset > npage) ? npage : (cpage+offset);
        return {left:left_off, right:right_off};
    },


    /**
     * Method that toggles the visibility of Page Link selector fields based upon
     * their data-pglink attribute setting.
     *
     *  Called by _processPageChange
     *
     * @method _disablePageSelector
     * @param linkSel
     * @param visible
     * @private
     */
    _disablePageSelector : function(linkSel, visible){
        linkSel = ( !Y.Lang.isArray(linkSel) ) ? [ linkSel ] : linkSel;
        visible = ( visible ) ? visible : false;
        var sel_srch = '[data-{suffix}="{sdata}"]',
            pag_cont = this.get('container');

        Y.Array.each(linkSel,function(pgid){
            var node = pag_cont.one(Y.Lang.sub(sel_srch,{suffix:'pglink',sdata:pgid}) );
            if ( node ) {
                if (visible) {
                    //node.setStyle('visibility','');
                    node.removeClass(this._myClassName('disabled'));
                } else {
                    //node.setStyle('visibility','hidden');
                    node.addClass(this._myClassName('disabled'));
                }
            }
        },this);
    },

    /**
     * Setter for the "model" attribute, that for convenience also sets a public property to this View.
     *
     * @method _setModel
     * @param val
     * @return {*}
     * @private
     */
    _setModel : function(val){
        if ( !val ) return;
        this.model = val;
        return val;
    },


    /**
     * Handler responds to Model's `pageChange` event
     *
     *  Listener set in _bindUI
     *
     * @method _modelPageChange
     * @param {EventHandle} e
     * @private
     */
    _modelPageChange: function(e) {
        var newPage = e.newVal;
        if ( newPage )
            this._processPageChange(newPage);
    },

    /**
     * Handler responds to Model's `itemsPerPageChange` event
     *
     *  Listener set in _bindUI
     *
     * @method _modelStateChange
     * @param {EventHandle} e
     * @private
     */
    _modelStateChange: function(e) {
        var newRPP = e.newVal;
        if (newRPP && !e.silent ) this.render();
    },


    /**
     * Method fired after the Paginator View is rendered,
     *   so that the SELECT[rowsPerPage] control can be updated
     *
     *  Listener set in _bindUI
     *
     * @method _updateRPPSelect
     * @private
     */
    _updateRPPSelect: function() {
        var pag_cont  = this.get('container'),
            model     = this.get('model'),
            selPage   = pag_cont.one('.'+this._classSelectRPP),
            pgOptions = this.get('pageOptions');

        // this part is to load "pageOptions" array
        if ( pgOptions && selPage ) {
            if ( Y.Lang.isArray(pgOptions) ) {
                //
                //  Clear out any initial options, and add new options
                //    using DOMNode methods ... seems to work better.
                //
                var opts = selPage.getDOMNode().options;
                opts.length = 0;

                Y.Array.each(pgOptions, function(optVal) {
                    var opt = new Option(optVal);
                    opts[opts.length] = opt;
                });
            }
        }

        // set current rowsPerPage to selected in combobox
        if ( selPage ) {
            var isAll = ( model && model.get('itemsPerPage') === model.get('totalItems') ) ? true : false;
            var opts = selPage.get('options');
            opts.each(function(opt) {
                if ( opt.get('value') == model.get('itemsPerPage')
                    || (opt.get('value').search(/all/i)!==-1 && isAll) )
                    opt.set('selected',true);
                //else if ( model.get('itemsPerPage') )
            },this);
        }

        if ( pag_cont.one('.'+this._classSelectPage) )
            this._updatePageSelect();
    },

    /**
     Method that responds to changes in the SELECT box for "page"

     @method _updatePageSelect
     @private
     @beta
     **/
    _updatePageSelect: function() {
        var pag_cont  = this.get('container'),
            model     = this.get('model'),
            selPage   = pag_cont.one('.'+this._classSelectPage);

        console.log('updatePageSelect fired after render ...');

        /*  clearly, this method is incomplete .... */
    },


    /**
     * Handler responding to INPUT[text] box page change.
     *
     * Listener set in _bindUI
     *
     * @method _inputChangePage
     * @param {EventHandle} e
     * @private
     */
    _inputChangePage: function(e) {
        var tar = e.target,
            val = +tar.get('value') || 1,
            model = this.get('model');

        if (val<1 || val>model.get('totalPages') ) {
            val = 1;
            tar.set('value',val);
        }
        model.set('page',val);
    },

    /**
     * Handler responding to a Page Selector "click" event.  The clicked Node is
     * reviewed for its data-pglink="" setting, and processed from that.
     *
     * Changed page is then sent back to the Model, which reprocesses the
     *  paginator settings (i.e. indices) and fires a `pageChange` event.
     *
     *  Listener set in _bindUI
     *
     * @method _clickChangePage
     * @param {EventHandle} e
     * @private
     */
    _clickChangePage: function(e) {
        var tar   = e.target,
            model = this.get('model');
        e.preventDefault();

        if (e.target.hasClass(this._myClassName('disabled')) || e.currentTarget.hasClass(this._myClassName('disabled'))) return;

        var page  = tar.getData('pglink') || e.currentTarget.getData('pglink'),
            npage = model.get('totalPages'),
            cpage = model.get('page'); //tar.get('text');

        if ( cpage && cpage === page ) return;

        switch(page) {
            case 'first':
                page = 1;
                break;
            case 'last':
                page = npage;
                break;
            case 'prev':
                page = (!cpage) ? 1 : (cpage === 1) ? npage : cpage - 1;
                break;
            case 'next':
                page = (!cpage) ? 1 : (cpage === npage ) ? 1 : cpage + 1;
                break;
            default:
                page = +page;

        }

        model.set('page',page);
    },

    /**
     * Handler that responds to SELECT changes for no. of rows per page
     *
     * Listener set in _bindUI
     *
     * @method _selectChangeRowOptions
     * @param {EventHandle} e
     * @private
     */
    _selectChangeRowOptions: function(e){
        var tar = e.target,
            val = +tar.get('value') || tar.get('value');

        if ( Y.Lang.isString(val) && val.toLowerCase() === 'all' ) {
            val = this.get('model').get('totalItems');
        }
        this.get('model').set('itemsPerPage',val);
        this.render();
    },

    /**
     * Method to sync the container for the paginator View with the underlying DataTable
     *  'table' element.
     *
     *  Unfortunately, there isn't a distinct, definitive 'render' complete event due to
     *   DT's complex rendering, so I use a timer function to attempt a resize.
     *
     * @method _resizePaginator
     * @private
     */
    _resizePaginator: function() {
        if ( this.get('paginatorResize') !== true || !this.get('dt') )  return;

        //TODO:  this is a total HACK, should figure a better way than later ...
        if ( !this._syncPaginatorSize() )
            Y.later(100,this,function(){ this._syncPaginatorSize(); } );
    },

    /**
     * Method to adjust the CSS width of the paginator container and set it to the
     *  width of the underlying DT.
     *
     * @method _syncPaginatorSize
     * @returns Boolean if success
     * @private
     */
    _syncPaginatorSize: function() {
        var tblCont = this.get('dt').get('boundingBox').one('table');
        if ( !tblCont ) return false;

        this.get('container').setStyle('width',tblCont.getComputedStyle('width'));
        this.fire('resize');
        return true;
    }


},{
    /**
     * The default set of attributes which will be available for instances of this class
     *
     * @property ATTRS
     * @type Object
     * @static
     */
    ATTRS:{

        /**
         * The base PaginatorModel that serves as data / change provider for this View.
         *
		 *	@example
         *      paginator:  new Y.PaginatorModel({
         *          itemsPerPage:  250
         *      }),
         *      OR
         *  	paginator:  myPagModel // where myPagModel is an instance previously created ...
         *
         * @attribute model
         * @default null
         * @type {Y.PaginatorModel}
         */
        model: {
            value:     null,
           // validator: function(v){ return v instanceof Y.PaginatorModel; },
            setter:    '_setModel'
        },

        /**
          The container holder for the contents of this View.  Can be entered either as
          a Y.Node instance or as a DOM "id" attribute (if prepended by "#").

		 	@example
                container: Y.one("#myDiv"),
                OR
                container: "#myDiv"

          NOTE: If the container node contains HTML <b>it will be used as the paginatorTemplate</b>


          @attribute container
          @default null
          @type {Node|String}
          @required
         **/
        container: {
            value: null
        },

        /**
         An array that will be used to populate the rows per page SELECT box ( using string replacement "{selectRowsPerPage}" or
         class selector "yui3-pagview-select-rowsperpage" ).

          @attribute pageOptions
          @type {Array}
          @default [ 10, 20, 'All' ]
         **/
        pageOptions: {
            value:      [ 10, 20, 'All' ],
            validator:  Y.Lang.isArray
        },

        /**
          A string that defines the Paginator HTML contents.  Can either be entered as a {String} including replacement parameters
          or as a {Node} instance whose contents will be read via .getHTML() or a DOM "id" element (indicated by '#' in first character)
          <br/><br/>
          To disable creation of any template (in order to do your own replacements of the template), set this to ''.

            @example
                paginatorTemplate:  '<div data-pglink="first">FIRST</div> {pageLinks} <div data-pglink="last">LAST</div>',
                paginatorTemplate:  Y.one('#script-id-tmpl'),
                paginatorTemplate:  Y.one('#script-id-tmpl').getHTML(),
                paginatorTemplate:  '#script-id-tmpl',   // where

          @attribute paginatorTemplate
          @type {Node|String}
          @default See TMPL_PAGINATOR static property
         **/
        paginatorTemplate:  {
            valueFn: function(){
                return this.TMPL_PAGINATOR;
            }
        },

        /**
         Defines the HTML template to be used for each individual page within the Paginator.  This can be used along
         with replacement tokens to create UI elements for each page link.  The template is used to construct the
         `{pageLinks}` replacement token with the paginator body.

         Recognized replacement tokens most appropriate to this attribute are `{page}`, `{pageStartIndex}` and
         `{pageEndIndex}`.

         A few examples of this template are listed below;
         @example
                pageLinkTemplate: '<a href="#" data-pglink="{page}" class="" title="Page No. {page}">{page}</a>'

         @attribute pageLinkTemplate
         @type String
         @default See TMPL_LINK static property
         **/
        pageLinkTemplate:   {
            valueFn: function(){
                return this.TMPL_LINK;
            }
        },

        // May not be necessary anymore
        linkHighLight: {
            value:      true,
            validator:  Y.Lang.isBoolean
        },

        /**
         Used to set the maximum number of page links that will be displayed for individual pages within `{pageLinks}`.
         This is the primary attribute to use to setup **abbreviated page links**, to avoid a long line of page links
         that travel across the page!

         Setting this to some number less than the total number of pages will begin abbreviating the links.
         <br/>(See also attributes [`linkListOffset`](#attr_linkListOffset) and [`pageLinkFiller`](#attr_pageLinkFiller), which work in conjunction with this attribute).

         @attribute maxPageLinks
         @type Integer
         @default 9999
         **/
        maxPageLinks:   {
            value:      9999,
            validator:  Y.Lang.isNumber
        },

        /**
         Setting that represents the number of links adjacent to the current page that should be displayed for instances where
         an *abbreviated* page link list is desired.
         <br/>(See [maxPageLinks](#attr_maxPageLinks) and [pageLinkFiller](#attr_pageLinkFiller) attributes).

         For example, a setting of this attribute to 1, will result in 3 page links (current page plus 1 each side),
         <br/>likewise a setting of 2, will results in 5 page links in the center of the paginator, etc.

         @attribute linkListOffset
         @type Integer
         @default 1
         **/
        linkListOffset: {
            value:      1,
            validator:  Y.Lang.isNumber
        },

        /**
         Setting the the ".. more" indicator to be used specifically for *abbreviated* page link lists.
         <br/>(See [maxPageLinks](#attr_maxPageLinks) and [linkListOffset](#attr_linkListOffset) attributes).

         @attribute pageLinkFiller
         @type String
         @default '...'
         **/
        pageLinkFiller: {
            value:      '...',
            validator:  Y.Lang.isString
        },

        /**
         Flag to indicate whether the first page link **within the `{pageLinks}` template** is to be displayed or not.
         <br/>Specifically intended for *abbreviated* page link lists (See [maxPageLinks](#attr_maxPageLinks) attribute).

         For Example;
         <br/>If our paginator state currently has 9 pages, and the current page is 5, if `alwaysShowLast:false` and `alwaysShowFirst:false`
            the link list will resemble;<br/>First | Prev | ... 4 5 6 ... | Next | Last

            Likewise, with `'alwaysShowLast:true` (and alwaysShowFirst:true) the link list will resemble;
         <br/>First | Prev | 1 ... 4 5 6 ... 9 | Next | Last

         @attribute alwaysShowFirst
         @type Boolean
         @default false
         **/
        alwaysShowFirst:{
            value:      false,
            validator:  Y.Lang.isBoolean
        },

        /**
         Flag to indicate whether the last page link **within the `{pageLinks}` template** is to be displayed or not.
         <br/>Specifically intended for *abbreviated* page link lists (See [maxPageLinks](#attr_maxPageLinks) attribute).

         See `alowsShowFirst` for an example.

         @attribute alwaysShowLast
         @type Boolean
         @default false
         **/
        alwaysShowLast:{
            value:      false,
            validator:  Y.Lang.isBoolean
        },

        /**

         @attribute selectPageFormat
         @type String
         @default 'Page {page}'
         @beta
         **/
        selectPageFormat: {
            value:      'Page {page}',
            validator:  Y.Lang.isString
        },

        /**
         Flag to indicate if the Paginator container should be re-sized to the DataTable size
         after rendering is complete.

         This attribute works best with a "bar" type of Paginator that is intended to look integral with a DataTable.

         @attribute paginatorResize
         @type Boolean
         @default false
         **/
        paginatorResize: {
            value:      false,
            validator:  Y.Lang.isBoolean
        },

        /**
         Flag indicating whether "circular" behavior of the Paginator View is desired.  If `true` the paginator
         will stop "disabling" First|Previous or Next|Last toggling and will continue at either 1st page or last
         page selections.  (i.e. when on *last* page, a *next* click will return to page 1)

         @attribute circular
         @type Boolean
         @default false
         **/
        circular : {
            value:      false,
            validator:  Y.Lang.isBoolean
        },

        /**
         A reference to the DataTable instance that may be using this paginator-view.  This is used primarily to handle
         resizing the Paginator View after rendering/updating.

         NOTE:  This attribute is usually set by other methods (i.e. Y.DataTable.Paginator) and not required to be set
         by the user directly.

         @attribute dt
         @type Y.DataTable
         @default null
         **/
        dt: {
            value:      null,
            validator:  function(v){ return v instanceof Y.DataTable }
        }
    }


    /**
     * Fires after the Paginator is resized to match the DataTable size (requires attribute "paginatorResize:true")
     * @event resize
     */

    /**
     * Fires after the DataTable change is reflected AND the Paginator has been completely rendered.
     * @event render
     */

    /**
     * Fires after the _processPageChange method has updated the pagination state.
     * @event pageChange
     * @param {Object} state The PaginatorModel `getAttrs()` "state" after updating to the current page as an object.
     * @since 3.5.0
     */


});

// requires:  "base-build", "model",  "view", 'substitute',  'paginator-css'
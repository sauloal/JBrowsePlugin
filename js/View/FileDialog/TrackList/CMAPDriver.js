define([
           'dojo/_base/declare',
           'JBrowse/Util',
           'JBrowse/Model/FileBlob',
           'JBrowse/Model/XHRBlob'
       ],
       function( declare, Util, FileBlob, XHRBlob ) {
var uniqCounter = 0;
return declare( null, {

    storeType: 'BioNanoGenomics/Store/SeqFeature/CMAP',

    tryResource: function( configs, resource ) {
        if( resource.type == 'cmap' ) {
            var basename = Util.basename(
                resource.file ? resource.file.name :
                resource.url  ? resource.url       :
                                '',
                ['.cmap']
            );
            if( !basename )
                return false;

            var newName = 'BNG_CMAP_'+basename+'_'+uniqCounter++;
            configs[newName] = {
                type: this.storeType,
                displayMode : 'collapsed',
                fileBasename: basename,
                blob: this._makeBlob( resource ),
                name: newName,
                rendered : false
            };
            return true;
        }
        else
            return false;
    },

    // try to merge any singleton BAM and BAI stores.  currently can only do this if there is one of each
    finalizeConfiguration: function( configs ) {
    },

    _makeBlob: function( resource ) {
        var r = resource.file ? new FileBlob( resource.file ) :
                resource.url  ? new XHRBlob( resource.url )   :
                                null;
        if( ! r )
            throw 'unknown resource type';
        return r;

    },

    confIsValid: function( conf ) {
        return conf.blob || conf.urlTemplate;
    }
});
});

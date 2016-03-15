/**
 * Fast, low-level functions for parsing and formatting GFF3.
 * JavaScript port of Robert Buels's Bio::GFF3::LowLevel Perl module.
 */

define([
           'dojo/_base/array'
       ],
       function(
           array
       ) {
var cmap_field_names = 'cmap_id contig_length num_sites site_id label_channel position std_dev coverage occurence'.split(' ');
var count = 1;
return {

    parse_feature: function( line ) {
        var f = array.map( line.split("\t"), function(a) {
            if( a == '.' ) {
                return null;
            }
            return a;
        });

        
        var parsed = {};
        // for( var i = 0; i < cmap_field_names.length; i++ ) {
        //     parsed[ cmap_field_names[i] ] = f[i] == '.' ? null : f[i];
        // }
        

        //For POC, the enzyme length is added to the positin to get the end.
        parsed.seq_id = f[0];
        parsed.type = "exon";
        parsed.start = parseInt(f[5],10);
        parsed.end = parseInt(f[5],10)+7;
        parsed.score = null;
        parsed.strand = null;
        parsed.phase = 0;
        parsed.attributes = { "ID":["Label"+count]};
        count++;
        return parsed;
        // if( parsed.start !== null )
        //     parsed.start = parseInt( parsed.start, 10 );
        // if( parsed.end !== null )
        //     parsed.end = parseInt( parsed.end, 10 );
        // if( parsed.score !== null )
        //     parsed.score = parseFloat( parsed.score, 10 );
        // if( parsed.strand != null )
        //     parsed.strand = {'+':1,'-':-1}[parsed.strand] || 0;
        // return parsed;
    },

    parse_directive: function( line ) {
        var match = /^\s*\#\#\s*(\S+)\s*(.*)/.exec( line );
        if( ! match )
            return null;
        var name = match[1], contents = match[2];

        var parsed = { directive : name };
        if( contents.length ) {
            contents = contents.replace( /\r?\n$/, '' );
            parsed.value = contents;
        }

        // do a little additional parsing for sequence-region and genome-build directives
        if( name == 'sequence-region' ) {
            var c = contents.split( /\s+/, 3 );
            parsed.seq_id = c[0];
            parsed.start  = c[1].replace(/\D/g,'');
            parsed.end    = c[2].replace(/\D/g,'');
        }
        else if( name == 'genome-build' ) {
            var c = contents.split( /\s+/, 2 );
            parsed.source    = c[0];
            parsed.buildname = c[1];
        }

        return parsed;
    },

    unescape: function( s ) {
        if( s === null )
            return null;

        return s.replace( /%([0-9A-Fa-f]{2})/g, function( match, seq ) {
                              return String.fromCharCode( parseInt( seq, 16 ) );
                          });
    },

    escape: function( s ) {
        return s.replace( /[\n\r\t;=%&,\x00-\x1f\x7f-\xff]/g, function( ch ) {
                              var hex = ch.charCodeAt(0).toString(16).toUpperCase();
                              if( hex.length < 2 ) // lol, apparently there's no native function for fixed-width hex output
                                  hex = '0'+hex;
                              return '%'+hex;
                          });
    },

    parse_attributes: function( attrString ) {

        if( !( attrString && attrString.length ) || attrString == '.' )
            return {};

        attrString = attrString.replace(/\r?\n$/, '' );

        var attrs = {};
        array.forEach( attrString.split(';'), function( a ) {
            var nv = a.split( '=', 2 );
            if( !( nv[1] && nv[1].length ) )
                return;
            var arec = attrs[ nv[0] ];
            if( ! arec )
                arec = attrs[ nv[0] ] = [];

            arec.push.apply(
                arec,
                array.map(
                    nv[1].split(','),
                    this.unescape
                ));
        },this);

        return attrs;
    },

    format_feature: function( f ) {
        var attrString =
            f.attributes === null || typeof f.attributes == 'undefined'
                ? '.' : this.format_attributes( f.attributes );

        var translate_strand=['-','.','+'];
        var fields = [];
        for( var i = 0; i<8; i++ ) {
            var val = f[ cmap_field_names[i] ];
            if(i==6) // deserialize strand
                fields[i] = val === null || val === undefined ? '.' : translate_strand[val+1];
            else  
                fields[i] = val === null || val === undefined ? '.' : this.escape( ''+val );
        }
        fields[8] = attrString;

        return fields.join("\t")+"\n";
    },

    format_attributes: function( attrs ) {
        var attrOrder = [];
        for( var tag in attrs ) {
            var val = attrs[tag];
            var valstring = val.hasOwnProperty( 'toString' )
                                ? this.escape( val.toString() ) :
                            val.values
                                ? function(val) {
                                    return val instanceof Array
                                        ? array.map( val, this.escape ).join(',')
                                        : this.escape( val );
                                  }.call(this,val.values) :
                            val instanceof Array
                                ? array.map( val, this.escape ).join(',')
                                : this.escape( val );
            attrOrder.push( this.escape( tag )+'='+valstring);
        }
        return attrOrder.length ? attrOrder.join(';') : '.';
    }
};
});

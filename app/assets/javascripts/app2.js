Number.prototype.number_with_delimiter = function(delimiter) {
    var number = this + '', delimiter = delimiter || ',';
    var split = number.split('.');
    split[0] = split[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter);
    return split.join('.');
  };

  // faceting global variables
  var refinements = {};
  function toggleRefinement(facet, value) {
    var refine = facet + ':' + value;
    refinements[refine] = !refinements[refine];
    search();
  }

  // strip HTML tags + keep <em>, <p>, <b>, <i>, <u>, <strong>
  function stripTags(v) {
    return $('<textarea />').text(v).html()
      .replace(/&lt;(\/)?(em|p|b|i|u|strong)&gt;/g, '<$1$2>');
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHTML (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  function escapeHTMLAttr(str) {
    return str
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&quot;');
  }

  //helper attribute multiple (ie: categories)
  function objToString(obj) {
    var str = '';
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str += str === '' ? '' : ' - ';
        str += obj[p];
      }
    }
    return str;
  }

  // attribute to skip every time
  var skip = [
    'objectID',
    '_highlightResult'
  ];

  // attribute to skip at the end since it can be multi-attribute
  var attributeToSkip = [];
  if ('company' !== ''){
    attributeToSkip.push('company');
  };
  if ('city' !== ''){
    attributeToSkip.push('city')
  };
  if ('zip' !== ''){
    attributeToSkip.push('');
  };

  // retrieve all keys and remove skipped ones
  function retrieveAllAttributes(hit){
    var i = 0;
    var allkeys = [];
    iterate(hit, '' , allkeys);
    for (var attr in attributeToSkip){
      var s = allkeys.indexOf(attributeToSkip[attr]);
      if(s != -1) {
        allkeys.splice(s, 1);
      }
    }
    return allkeys;
  }

  // recursively find keys in object
  function iterate(obj, stack , allkeys) {
    var dot = stack === '' ? '' : '.';
    for (var property in obj) {
      if ( obj.hasOwnProperty(property) && skip.indexOf(property) === -1 ) {
        if (typeof obj[property] === "object") {
          if (Object.prototype.toString.call(obj[property]) === '[object Array]') {
            if (obj[property].length > 0 && typeof obj[property][0] === 'object') {
              iterate(obj[property], stack + dot + property, allkeys);
            } else {
              allkeys.push(stack + dot + property);
            }
          } else {
            iterate(obj[property], stack + dot + property, allkeys);
          }
        } else {
          allkeys.push(stack + dot + property);
        }
      }
    }
  }

  function urlMatch(url) {
    var urlRegex = new RegExp(
      "^" +
        // protocol identifier
        "(?:(?:https?|ftp)://)" +
        // user:pass authentication
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:" +
          // IP address exclusion
          // private & local networks
          "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
          "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
          "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
          // IP address dotted notation octets
          // excludes loopback network 0.0.0.0
          // excludes reserved space >= 224.0.0.0
          // excludes network & broacast addresses
          // (first & last IP address of each class)
          "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
          "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
          "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
          // host name
          "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
          // domain name
          "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
          // TLD identifier
          "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
          // TLD may end with dot
          "\\.?" +
        ")" +
        // port number
        "(?::\\d{2,5})?" +
        // resource path
        "(?:[/?#]\\S*)?" +
      "$", "i"
    );

    return !!String(url).match(urlRegex);
  }

  // return attribute or highlighted attribute
  function getAttributeValue(attr_string, hit) {
    var v = getStringAttributeFromObject(attr_string, hit._highlightResult);
    return v ? v : getStringAttributeFromObject(attr_string, hit);
  }

  function capitalize(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
  }

  // handle attribute from tree
  function getStringAttributeFromObject(attr_string, hit){
    var attr_array = attr_string.split(".");
    var attr = hit;
    $.each(attr_array, function(i){
      attr = attr && attr[attr_array[i]];
    });
    if (!attr) {
      return false;
    }
    if (attr.value) {
      // we're on a highlighted form
      return attr.value;
    }
    if (Object.prototype.toString.call(attr) === '[object Array]') {
      var str = [];
      $.each(attr, function(i, e) {
        if (e && typeof e === 'string') {
          str.push(e);
        } else if (e && e.value) {
          str.push(e.value);
        } else if (e) {
          str.push(objToString(e));
        }
      });
      return str.join(', ');
    }
    if (typeof attr === 'object') {
      attr = objToString(attr);
    }
    return '' + attr;
  }

  // function called on each keystroke
  function searchCallback(error, content) {
    if (error || content.query != $("#inputfield input").val()) {
      // this results is out-dated, do not consider it
      return;
    }
    if (content.hits.length == 0 ) {
      // no results or empty query
      $('#stats').empty();
      $('#facets').empty();
      $('#hits').empty();
      return;
    }
    var res = '';
    for (var i = 0; i < content.hits.length; ++i) {
      var hit = content.hits[i];
      // render the hit
      res += '<div class="hit">';
      /// hit image ?
      if ('' !== '') {
        var img_src = getStringAttributeFromObject('',hit);
        res += '<span class="image-attribute"><img src="https://usercontent.algolia.com/80/' + escapeHTML(img_src) + '"/></span>';
      }
      // hit title (primary attribute)
      if ('company' !== '') {
       var v = getAttributeValue('company',hit);
       res += '<span class="primary-attribute">';
       if ('' !== '') {
         // url attribute
         var url = stripTags(getStringAttributeFromObject('',hit));
         res += '<a href="' + ((urlMatch(url)) ? escapeHTML(url) : '') + '">';
         res +=  stripTags(v);
         res += '</a>';
       } else {
         res += stripTags(v);
       }
       res += '</span> ';
      }
      // hit subtitle (secondary attribute)
      if ('city' !== '') {
        var v =  getAttributeValue('city',hit);
        if (v && v.trim() !== '') {
          res += '<span class="secondary-attribute">' + stripTags(v) + '</span>';
        }
      }
      // hit description (tertiary attribute)
      if ('zip' !== '') {
        var v =  getAttributeValue('zip',hit);
        if (v && v.trim() !== '') {
          res += '<span class="tertiary-attribute">' + stripTags(v) + '</span>';
        }
      }
      // display all others attributes
      if (true) {
        var allkeys = retrieveAllAttributes(hit);
        if (allkeys.length > 0){
          res += '<dl class="others-attribute dl-horizontal row">';
          for (var attr in allkeys) {
            var v;
            v = getAttributeValue(allkeys[attr],hit);
            if (v && v.trim() !== '') {
              res += '<dt class="col-md-3">' + stripTags(allkeys[attr]) + ': </dt><dd class="col-md-9">' + stripTags(v) + "</dd>";
            }
          }
        }
        res += '</dl>';
      }
      res += '<div class="clearfix"></div></div>';
    }

    $('#hits').html(res);

    if (content.facets && !$.isEmptyObject(content.facets)) {
      res = '<ul class="list-unstyled">'
      for (var facet in content.facets) {
        var facets = [];
        for (var f in content.facets[facet]) {
          facets.push([f, content.facets[facet][f]]);
        }
        facets.sort(function(a, b) { return a[1] < b[1] ? 1 : (a[1] > b[1] ? -1 : 0) });
        res += '<li class="m-b-large"><h3>' + capitalize(stripTags(facet)).replace(/_/g, ' ') + '</h3>' +
          '<ol class="list-unstyled m-l">' +
          $.map(facets, function(v, i) {

            var $wrap = $('<div/>');
            var $el = $('<li/>');
            var $a = $('<a/>');

            $('#facets').data(
              escapeHTMLAttr(facet) + '-' + i,
              {
                name: facet,
                value: v[0]
              }
            );

            $el.addClass(refinements[facet + ':' + v[0]] ? 'active' : '');
            $a.text(stripTags(v[0]));
            $a.attr('href', '#');
            $a.addClass('facet-value');
            $a.attr('data-facet-name', escapeHTMLAttr(facet));
            $a.attr('data-facet-index', i);

            $el.append(
              $('<span/>').append($a)
            ).append($('<span class="pull-right"/>').append(v[1]));

            $wrap.append($el);

            return $wrap.html();

            // return '<li class="' + stripTags(refinements[facet + ':' + v[0]] ? 'active' : '') + '"><a href="#" class="facet-value" data-facet-name="'+ escapeHTMLAttr(facet) +'" data-facet-value="'+ escapeHTMLAttr(v[0]) +'">' + stripTags(v[0]) + '</a> (' + v[1] + ')</li>';
          }).join('') +
          '</ol></li>';
      }
      res += '</ul>'
      $('#facets').html(res).css('float', 'left').css('width', '20%');
      $('#hits').css('float', 'right').css('width', '75%');
    }

    // stats
    $('#stats').html('<b>' + content.nbHits.number_with_delimiter() + '</b> result' + (content.nbHits > 1 ? 's' : '') + ' in <b>' + content.processingTimeMS + '</b> ms')
  }


  $(function() {
    var algolia = algoliasearch('ICKZN7NR9X', 'a8f88c3250a41d5274eafb1730f0cf6b');
    var index = algolia.initIndex('new_pressings');

    window.search = function() {
      var facetFilters = [];
      for (var refine in refinements) {
        if (refinements[refine]) {
          facetFilters.push(refine);
        }
      }
      index.search($("#inputfield input").val(), {
        hitsPerPage: 10,
        facets: '*',
        maxValuesPerFacet: 10,
        facetFilters: facetFilters
      }, searchCallback);
    }

    $("#inputfield input").keyup(function() {
      refinements = {};
      window.search();
    }).focus();

    if ($("#inputfield input").val() === '') {
      window.search();
    }

    $('#facets').on('click', '.facet-value', function(e) {
      var facetName = $(e.target).attr('data-facet-name');
      var facetNumber = $(e.target).attr('data-facet-index');
      var facet = $('#facets').data(facetName + '-' + facetNumber);

      toggleRefinement(facet.name, facet.value);
    });
  });
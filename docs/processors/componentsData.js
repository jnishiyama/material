var _ = require('lodash');
var path = require('canonical-path');
var ngModuleData = require('../util/ngModuleData');
var sass = require('node-sass');

function publicDocData(doc, extraData) {
  return _.assign({
    name: doc.name,
    type: doc.docType,
    href: doc.path,
    label: doc.label || doc.name
  }, extraData || {});
}

module.exports = function componentsGenerateProcessor(log, moduleMap) {
  return {
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process: process
  };

  function process(docs) {

    
    // We are only interested in pages that are not landing pages
    var pages = _.filter(pages, function(page) {
      return page.docType != 'componentGroup';
    });

    var components = _(pages)
      .filter('module') // We are not interested in docs that are not in a module
      .groupBy('module')
      .map(function(modulePages, moduleName) {
        log.debug('moduleName: ' + moduleName);
        var moduleItems = [];
        var modulePage;

        _(modulePages)
          .groupBy('docType')
          .tap(function(docTypes) {
            log.debug(moduleName, _.keys(docTypes));
            // Extract the module page from the collection
            modulePage = docTypes.module[0];
            delete docTypes.module;
          })
          .forEach(function(sectionPages, sectionName) {
            // Sort a page by @order attribute if given.
            // If not given, sort by name.
            sectionPages = _(sectionPages)
              .each(function(page) {
                page.order = angular.isDefined(page.order) ? page.order : page.name;
              })
              .sortBy(sectionPages, 'name')
              .value();

            if (sectionPages.length) {
              moduleItems.push({
                name: sectionName,
                type: 'section',
                href: path.dirname(sectionPages[0].path)
              });
              _.each(sectionPages, function(page) {
                moduleItems.push({
                  name: page.name,
                  type: page.docType,
                  href: page.path
                });
              });
            }
          });

          return {
            name: moduleName,
            href: modulePage.path,
            type: 'group',
            items: moduleItems
          };
      })
      .value();

    docs.push({
      template: 'components-data.template.html',
      outputPath: 'js/components-data.js',
      components: components
    });

  }
};


angular.module('templates', ['src/wizardTemplate.html']);

angular.module("src/wizardTemplate.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("src/wizardTemplate.html",
    "<div class=\"row wizard-container\">\n" +
    "    <div class=\"col-md-3 col-xs-12\">\n" +
    "        <ul class=\"nav nav-pills nav-stacked wizard-sidebar\">\n" +
    "            <li tooltip=\"{{getProgressPercentage() | number : 2}}%\">\n" +
    "                <progressbar value=\"getProgressPercentage()\" type=\"{{getProgressPercentage() == 100 ? 'success' : 'default'}}\"></progressbar>\n" +
    "            </li>\n" +
    "            <li ng-repeat=\"step in steps\" ng-class=\"{disabled: getStepState(step) == stepStatesEnum.disabled, active: getCurrentStep() == step}\"\n" +
    "                ng-click=\"goToStepByReference(step)\" ng-disabled=\"getStepState(step) == stepStatesEnum.disabled\">\n" +
    "                <a>\n" +
    "                    {{step.title}} <i class=\"fa fa-check\" ng-show=\"getStepState(step) == stepStatesEnum.complete\"></i>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-9 col-xs-12 wizard-main\">\n" +
    "        <ul class=\"pager\">\n" +
    "            <li class=\"previous\" ng-class=\"{disabled: !hasPrevious()}\"><a ng-click=\"goToPrevious()\"><i class=\"fa fa-arrow-circle-left\"></i> {{prevString}}</a></li>\n" +
    "            <li ng-repeat=\"step in steps\">\n" +
    "                <i class=\"fa\" ng-class=\"{'fa-circle-o disabled': getStepState(step) == stepStatesEnum.disabled, 'fa-circle': getStepState(step) == stepStatesEnum.complete, 'fa-circle-o': getStepState(step) == stepStatesEnum.ready, selected: getCurrentStep() == step}\"\n" +
    "                   ng-click=\"goToStepByReference(step)\" tooltips tooltip-template=\"{{step.title}}\" tooltip-side=\"top\"></i>\n" +
    "            </li>\n" +
    "            <li class=\"next\" ng-class=\"{disabled: !hasNext()}\"><a ng-click=\"goToNext()\">{{nextString}} <i class=\"fa fa-arrow-circle-right\"></i></a></li>\n" +
    "        </ul>\n" +
    "        <div class=\"wizard-step-container\" ng-transclude></div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <button class=\"btn btn-primary btn-block submit animate fade-in-out\" ng-hide=\"!isSubmittable()\" ng-click=\"onSubmitClicked()\" ng-disabled=\"submitting\">{{submitString}} <i class=\"fa fa-circle-o-notch fa-spin\" ng-show=\"submitting\"></i></button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

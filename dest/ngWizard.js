angular.module("ngWizard", [ "ui.bootstrap", "ngAnimate", "templates" ]).directive("wizard", [ "$window", "$q", function($window, $q) {
    "use strict";
    return {
        restrict: "E",
        transclude: true,
        scope: {
            currentStepNumber: "=",
            submit: "&"
        },
        templateUrl: "src/wizardTemplate.html",
        controller: function($scope) {
            $scope.currentStepNumber = $scope.currentStepNumber || 0;
            $scope.getCurrentStep = function() {
                return $scope.steps[$scope.currentStepNumber];
            };
            this.getCurrentStep = $scope.getCurrentStep;
            $scope.goToStepByReference = function(step) {
                var stepNumber = $scope.steps.indexOf(step);
                return $scope.goToStep(stepNumber);
            };
            var isValidStepNumber = function(stepNumber) {
                return stepNumber < $scope.steps.length && stepNumber >= 0;
            };
            $scope.canGoToStep = function(stepNumber) {
                if (!isValidStepNumber(stepNumber)) {
                    return false;
                }
                var newStep = $scope.steps[stepNumber];
                return $scope.getStepState(newStep) != $scope.stepStatesEnum.disabled;
            };
            $scope.goToStep = function(stepNumber) {
                if ($scope.canGoToStep(stepNumber)) {
                    $scope.currentStepNumber = stepNumber;
                    return true;
                }
                return false;
            };
            $scope.getStepState = function(step) {
                if (step.requiredStepNumber && $scope.getStepState($scope.steps[step.requiredStepNumber]) != $scope.stepStatesEnum.complete) {
                    return $scope.stepStatesEnum.disabled;
                } else if (step.stepForm.$valid) {
                    return $scope.stepStatesEnum.complete;
                } else return $scope.stepStatesEnum.ready;
            };
            $scope.stepStatesEnum = {
                disabled: 0,
                ready: 1,
                complete: 2
            };
            $scope.goToNext = function() {
                $scope.goToStep($scope.currentStepNumber + 1);
            };
            $scope.hasNext = function() {
                return $scope.steps.length > $scope.currentStepNumber + 1 && $scope.getStepState($scope.steps[$scope.currentStepNumber + 1]) != $scope.stepStatesEnum.disabled;
            };
            $scope.goToPrevious = function() {
                $scope.goToStep($scope.currentStepNumber - 1);
            };
            $scope.hasPrevious = function() {
                return $scope.currentStepNumber > 0;
            };
            $scope.getProgressPercentage = function() {
                var completeSteps = $scope.steps.filter(function(step) {
                    return $scope.getStepState(step) == $scope.stepStatesEnum.complete;
                });
                return completeSteps.length / $scope.steps.length * 100;
            };
            $scope.steps = [];
            this.registerStep = function(stepScope) {
                $scope.steps.push(stepScope);
            };
            this.unregisterStep = function(stepScope) {
                var index = $scope.steps.indexOf(stepScope);
                if (index >= 0) {
                    $scope.steps.splice(index, 1);
                }
            };
            $scope.isSubmittable = function() {
                return $scope.steps.every(function(step) {
                    return $scope.getStepState(step) == $scope.stepStatesEnum.complete;
                });
            };
            $scope.submitting = false;
            $scope.onSubmitClicked = function() {
                $scope.submitting = true;
                $q.when($scope.submit()).then(function() {
                    $scope.submitting = false;
                });
            };
            $scope.$watch("currentStepNumber", function(val, oldVal) {
                if (val != oldVal) {
                    if (!$scope.canGoToStep(val)) {
                        if (oldVal && $scope.canGoToStep(oldVal)) {
                            $scope.currentStepNumber = oldVal;
                        } else $scope.currentStepNumber = 0;
                    } else {
                        $scope.getCurrentStep().entered();
                    }
                }
            });
            $scope.$watch("steps.length", function() {
                if (!$scope.getCurrentStep()) {
                    $scope.currentStepNumber = 0;
                }
            }, true);
        }
    };
} ]).directive("wizardStep", function() {
    return {
        require: "^wizard",
        restrict: "E",
        transclude: true,
        scope: {
            title: "@",
            requiredStepNumber: "@",
            entered: "&",
            animation: "@"
        },
        template: "<ng-form name='stepForm' ng-show='isActive()' class='wizard-step animate'  ng-class='animation || \"slide\"'><ng-transclude></ng-transclude></ng-form>",
        link: function($scope, element, attrs, wizardCtrl) {
            wizardCtrl.registerStep($scope);
            $scope.isActive = function() {
                return $scope == wizardCtrl.getCurrentStep();
            };
            $scope.$on("$destroy", function() {
                wizardCtrl.unregisterStep($scope);
            });
        }
    };
});

angular.module("templates", [ "src/wizardTemplate.html" ]);

angular.module("src/wizardTemplate.html", []).run([ "$templateCache", function($templateCache) {
    $templateCache.put("src/wizardTemplate.html", '<div class="row wizard-container">\n' + '    <div class="col-md-3 col-xs-12">\n' + '        <ul class="nav nav-pills nav-stacked wizard-sidebar">\n' + '            <li tooltip="{{getProgressPercentage() | number : 2}}%">\n' + "                <progressbar value=\"getProgressPercentage()\" type=\"{{getProgressPercentage() == 100 ? 'success' : 'default'}}\"></progressbar>\n" + "            </li>\n" + '            <li ng-repeat="step in steps" ng-class="{disabled: getStepState(step) == stepStatesEnum.disabled, active: getCurrentStep() == step}"\n' + '                ng-click="goToStepByReference(step)" ng-disabled="getStepState(step) == stepStatesEnum.disabled">\n' + "                <a>\n" + '                    {{step.title}} <i class="fa fa-check" ng-show="getStepState(step) == stepStatesEnum.complete"></i>\n' + "                </a>\n" + "            </li>\n" + "        </ul>\n" + "    </div>\n" + '    <div class="col-md-9 col-xs-12 wizard-main">\n' + '        <ul class="pager">\n' + '            <li class="previous" ng-class="{disabled: !hasPrevious()}"><a href="#" ng-click="goToPrevious()"><i class="fa fa-arrow-circle-left"></i> Previous</a></li>\n' + '            <li ng-repeat="step in steps">\n' + "                <i class=\"fa\" ng-class=\"{'fa-circle-o disabled': getStepState(step) == stepStatesEnum.disabled, 'fa-circle': getStepState(step) == stepStatesEnum.complete, 'fa-circle-o': getStepState(step) == stepStatesEnum.ready, selected: getCurrentStep() == step}\"\n" + '                   ng-click="goToStepByReference(step)" tooltip="{{step.title}}"></i>\n' + "            </li>\n" + '            <li class="next" ng-class="{disabled: !hasNext()}"><a href="#" ng-click="goToNext()">Next <i class="fa fa-arrow-circle-right"></i></a></li>\n' + "        </ul>\n" + '        <div class="wizard-step-container" ng-transclude></div>\n' + "    </div>\n" + '    <div class="row">\n' + '        <div class="col-xs-12">\n' + "            <!--Don't know why, but ng-hide doesn't work here, use ng-class instead-->\n" + '            <button class="btn btn-primary btn-block submit" ng-class="{\'ng-hide\': !isSubmittable()}" ng-click="onSubmitClicked()" ng-disabled="submitting">Submit <i class="fa fa-circle-o-notch fa-spin" ng-show="submitting"></i></button>\n' + "        </div>\n" + "    </div>\n" + "</div>");
} ]);
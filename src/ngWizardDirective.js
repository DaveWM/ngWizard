angular.module("ngWizard", ['720kb.tooltips', 'ngAnimate', 'ngWizardTemplates'])
    .directive('wizard', ['$window','$q', function($window, $q) {
        "use strict";

        return {
            restrict: 'E',
            transclude: true,
            scope: {
                currentStepNumber: '=',
                submit: '&'
            },
            templateUrl: "ngWizardTemplate.html",
            controller: function($scope, wizardConfigProvider) {
                $scope.prevString = wizardConfigProvider.prevString;
                $scope.nextString = wizardConfigProvider.nextString;
                $scope.submitString = wizardConfigProvider.submitString;

                $scope.currentStepNumber = $scope.currentStepNumber || 0;

                $scope.getCurrentStep = function() {
                    return $scope.steps[$scope.currentStepNumber];
                };
                // need to register the method on the controller as well, so it can be accessed by the wizard steps
                this.getCurrentStep = $scope.getCurrentStep;

                $scope.goToStepByReference = function(step) {
                    var stepNumber = $scope.steps.indexOf(step);
                    return $scope.goToStep(stepNumber);
                };

                // returns whether the step number is between 0 and the number of steps - 1
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
                    // step requires a previous step to be complete, and it is not
                    if (step.requiredStepNumber && isValidStepNumber(step.requiredStepNumber) &&
                        $scope.getStepState($scope.steps[step.requiredStepNumber]) != $scope.stepStatesEnum.complete) {
                        return $scope.stepStatesEnum.disabled;
                    }
                    // if form is valid, step is complete
                    else if (step.stepForm && step.stepForm.$valid) {
                        return $scope.stepStatesEnum.complete;
                    }
                    else return $scope.stepStatesEnum.ready;
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
                    return $scope.steps.length > $scope.currentStepNumber + 1 &&
                        $scope.getStepState($scope.steps[$scope.currentStepNumber + 1]) != $scope.stepStatesEnum.disabled;
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
                    return (completeSteps.length / $scope.steps.length) * 100;
                };

                $scope.steps = [];
                // assume steps are registered in order
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

                $scope.$watch('currentStepNumber', function (val, oldVal) {
                    // don't do anything if step hasn't changed
                    if (val != oldVal) {
                        // try to go to new step number, if it doesn't work don't allow the change.
                        // if "oldVal" (the previous step number) is not defined/is invalid, go to step 0 (always valid)
                        if (!$scope.canGoToStep(val)) {
                            if (oldVal && $scope.canGoToStep(oldVal)) {
                                $scope.currentStepNumber = oldVal;
                            }
                            else $scope.currentStepNumber = 0;
                        }
                        // successfully navigated to step
                        else {
                            $scope.getCurrentStep().entered();
                        }
                    }
                });
                // watch the number of steps, in case we are on the last step and it is removed
                $scope.$watch('steps.length', function() {
                    if (!$scope.getCurrentStep()) {
                        $scope.currentStepNumber = 0;
                    }
                }, true);
            }
        };
    }])
    .directive('wizardStep', function() {
      return {
          require: '^wizard',
          restrict: 'E',
          transclude: true,
          scope: {
              title: '@',
              // the required step must be completed for this step to be enabled
              requiredStepNumber: '@',
              entered: '&',
              animation: '@'
          },
          template: "<ng-form name='stepForm' ng-show='isActive()' class='wizard-step animate'  ng-class='animation || \"slide\"'><ng-transclude></ng-transclude></ng-form>",
          link: function ($scope, element, attrs, wizardCtrl) {
              wizardCtrl.registerStep($scope);
              $scope.isActive = function() {
                  return $scope == wizardCtrl.getCurrentStep();
              };

              $scope.$on("$destroy", function() {
                  wizardCtrl.unregisterStep($scope);
              });
          }
       };
    })
    .provider('wizardConfigProvider', function () {
      this.nextString = 'Next';
      this.prevString = 'Previous';
      this.submitString = 'Submit';

      this.$get = function() {
        return this;
      };
    });

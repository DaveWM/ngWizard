angular.module("ngWizard", [ "720kb.tooltips", "ngAnimate", "ngWizardTemplates" ]).directive("wizard", [ "$window", "$q", function($window, $q) {
    "use strict";
    return {
        restrict: "E",
        transclude: true,
        scope: {
            currentStepNumber: "=",
            submit: "&"
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
                if (step.requiredStepNumber && isValidStepNumber(step.requiredStepNumber) && $scope.getStepState($scope.steps[step.requiredStepNumber]) != $scope.stepStatesEnum.complete) {
                    return $scope.stepStatesEnum.disabled;
                } else if (step.stepForm && step.stepForm.$valid) {
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
}).provider("wizardConfigProvider", function() {
    this.nextString = "Next";
    this.prevString = "Previous";
    this.submitString = "Submit";
    this.$get = function() {
        return this;
    };
});

angular.module("ngWizardTemplates", [ "ngWizardTemplate.html" ]);

angular.module("ngWizardTemplate.html", []).run([ "$templateCache", function($templateCache) {
    $templateCache.put("ngWizardTemplate.html", '<div class="row wizard-container">\n' + '    <div class="col-md-3 col-xs-12">\n' + '        <ul class="nav nav-pills nav-stacked wizard-sidebar">\n' + '            <li tooltip="{{getProgressPercentage() | number : 2}}%">\n' + "                <progressbar value=\"getProgressPercentage()\" type=\"{{getProgressPercentage() == 100 ? 'success' : 'default'}}\"></progressbar>\n" + "            </li>\n" + '            <li ng-repeat="step in steps" ng-class="{disabled: getStepState(step) == stepStatesEnum.disabled, active: getCurrentStep() == step}"\n' + '                ng-click="goToStepByReference(step)" ng-disabled="getStepState(step) == stepStatesEnum.disabled">\n' + "                <a>\n" + '                    {{step.title}} <i class="fa fa-check" ng-show="getStepState(step) == stepStatesEnum.complete"></i>\n' + "                </a>\n" + "            </li>\n" + "        </ul>\n" + "    </div>\n" + '    <div class="col-md-9 col-xs-12 wizard-main">\n' + '        <ul class="pager">\n' + '            <li class="previous" ng-class="{disabled: !hasPrevious()}"><a ng-click="goToPrevious()"><i class="fa fa-arrow-circle-left"></i> {{prevString}}</a></li>\n' + '            <li ng-repeat="step in steps">\n' + "                <i class=\"fa\" ng-class=\"{'fa-circle-o disabled': getStepState(step) == stepStatesEnum.disabled, 'fa-circle': getStepState(step) == stepStatesEnum.complete, 'fa-circle-o': getStepState(step) == stepStatesEnum.ready, selected: getCurrentStep() == step}\"\n" + '                   ng-click="goToStepByReference(step)" tooltips tooltip-template="{{step.title}}" tooltip-side="top"></i>\n' + "            </li>\n" + '            <li class="next" ng-class="{disabled: !hasNext()}"><a ng-click="goToNext()">{{nextString}} <i class="fa fa-arrow-circle-right"></i></a></li>\n' + "        </ul>\n" + '        <div class="wizard-step-container" ng-transclude></div>\n' + "    </div>\n" + '    <div class="row">\n' + '        <div class="col-xs-12">\n' + '            <button class="btn btn-primary btn-block submit animate fade-in-out" ng-hide="!isSubmittable()" ng-click="onSubmitClicked()" ng-disabled="submitting">{{submitString}} <i class="fa fa-circle-o-notch fa-spin" ng-show="submitting"></i></button>\n' + "        </div>\n" + "    </div>\n" + "</div>\n" + "");
} ]);

(function withAngular(angular, window) {
    "use strict";
    var directiveName = "tooltips", resizeObserver = function resizeObserver() {
        var callbacks = [], lastTime = 0, runCallbacks = function runCallbacks(currentTime) {
            if (currentTime - lastTime >= 15) {
                callbacks.forEach(function iterator(callback) {
                    callback();
                });
                lastTime = currentTime;
            } else {
                window.console.log("Skipped!");
            }
        }, resize = function resize() {
            window.requestAnimationFrame(runCallbacks);
        }, addCallback = function addCallback(callback) {
            if (callback) {
                callbacks.push(callback);
            }
        };
        return {
            add: function add(callback) {
                if (!callbacks.length) {
                    window.addEventListener("resize", resize);
                }
                addCallback(callback);
            }
        };
    }(), getAttributesToAdd = function getAttributesToAdd(element) {
        var attributesToAdd = {};
        element.removeAttr(directiveName);
        if (element.attr("tooltip-template") !== undefined) {
            attributesToAdd["tooltip-template"] = element.attr("tooltip-template");
            element.removeAttr("tooltip-template");
        }
        if (element.attr("tooltip-template-url") !== undefined) {
            attributesToAdd["tooltip-template-url"] = element.attr("tooltip-template-url");
            element.removeAttr("tooltip-template-url");
        }
        if (element.attr("tooltip-controller") !== undefined) {
            attributesToAdd["tooltip-controller"] = element.attr("tooltip-controller");
            element.removeAttr("tooltip-controller");
        }
        if (element.attr("tooltip-side") !== undefined) {
            attributesToAdd["tooltip-side"] = element.attr("tooltip-side");
            element.removeAttr("tooltip-side");
        }
        if (element.attr("tooltip-show-trigger") !== undefined) {
            attributesToAdd["tooltip-show-trigger"] = element.attr("tooltip-show-trigger");
            element.removeAttr("tooltip-show-trigger");
        }
        if (element.attr("tooltip-hide-trigger") !== undefined) {
            attributesToAdd["tooltip-hide-trigger"] = element.attr("tooltip-hide-trigger");
            element.removeAttr("tooltip-hide-trigger");
        }
        if (element.attr("tooltip-smart") !== undefined) {
            attributesToAdd["tooltip-smart"] = element.attr("tooltip-smart");
            element.removeAttr("tooltip-smart");
        }
        if (element.attr("tooltip-class") !== undefined) {
            attributesToAdd["tooltip-class"] = element.attr("tooltip-class");
            element.removeAttr("tooltip-class");
        }
        if (element.attr("tooltip-close-button") !== undefined) {
            attributesToAdd["tooltip-close-button"] = element.attr("tooltip-close-button");
            element.removeAttr("tooltip-close-button");
        }
        if (element.attr("tooltip-size") !== undefined) {
            attributesToAdd["tooltip-size"] = element.attr("tooltip-size");
            element.removeAttr("tooltip-size");
        }
        if (element.attr("tooltip-speed") !== undefined) {
            attributesToAdd["tooltip-speed"] = element.attr("tooltip-speed");
            element.removeAttr("tooltip-speed");
        }
        return attributesToAdd;
    }, getStyle = function getStyle(anElement) {
        if (window.getComputedStyle) {
            return window.getComputedStyle(anElement, "");
        } else if (anElement.currentStyle) {
            return anElement.currentStyle;
        }
    }, getAppendedTip = function getAppendedTip(theTooltipElement) {
        var tipsInBody = window.document.querySelectorAll("._exradicated-tooltip"), aTipInBody, tipsInBodyIndex = 0, tipsInBodyLength = tipsInBody.length, angularizedElement;
        for (;tipsInBodyIndex < tipsInBodyLength; tipsInBodyIndex += 1) {
            aTipInBody = tipsInBody.item(tipsInBodyIndex);
            if (aTipInBody) {
                angularizedElement = angular.element(aTipInBody);
                if (angularizedElement.data("_tooltip-parent") && angularizedElement.data("_tooltip-parent") === theTooltipElement) {
                    return angularizedElement;
                }
            }
        }
    }, removeAppendedTip = function removeAppendedTip(theTooltipElement) {
        var tipElement = getAppendedTip(theTooltipElement);
        if (tipElement) {
            tipElement.remove();
        }
    }, isOutOfPage = function isOutOfPage(theTipElement) {
        if (theTipElement) {
            var squarePosition = theTipElement[0].getBoundingClientRect();
            if (squarePosition.top < 0 || squarePosition.top > window.document.body.offsetHeight || squarePosition.left < 0 || squarePosition.left > window.document.body.offsetWidth || squarePosition.bottom < 0 || squarePosition.bottom > window.document.body.offsetHeight || squarePosition.right < 0 || squarePosition.right > window.document.body.offsetWidth) {
                theTipElement.css({
                    top: "",
                    left: "",
                    bottom: "",
                    right: ""
                });
                return true;
            }
            return false;
        }
        throw new Error("You must provide a position");
    }, tooltipConfigurationProvider = function tooltipConfigurationProvider() {
        var tooltipConfiguration = {
            side: "top",
            showTrigger: "mouseover",
            hideTrigger: "mouseleave",
            "class": "",
            smart: false,
            closeButton: false,
            size: "",
            speed: "steady"
        };
        return {
            configure: function configure(configuration) {
                var configurationKeys = Object.keys(tooltipConfiguration), configurationIndex = 0, aConfigurationKey;
                if (configuration) {
                    for (;configurationIndex < configurationKeys.length; configurationIndex += 1) {
                        aConfigurationKey = configurationKeys[configurationIndex];
                        if (aConfigurationKey && configuration[aConfigurationKey]) {
                            tooltipConfiguration[aConfigurationKey] = configuration[aConfigurationKey];
                        }
                    }
                }
            },
            $get: function instantiateProvider() {
                return tooltipConfiguration;
            }
        };
    }, tooltipDirective = [ "$log", "$http", "$compile", "$timeout", "$controller", "$injector", "tooltipsConf", function tooltipDirective($log, $http, $compile, $timeout, $controller, $injector, tooltipsConf) {
        var linkingFunction = function linkingFunction($scope, $element, $attrs, $controllerDirective, $transcludeFunc) {
            if ($attrs.tooltipTemplate && $attrs.tooltipTemplateUrl) {
                throw new Error("You can not define tooltip-template and tooltip-template-url together");
            }
            if (!($attrs.tooltipTemplateUrl || $attrs.tooltipTemplate) && $attrs.tooltipController) {
                throw new Error("You can not have a controller without a template or templateUrl defined");
            }
            var oldTooltipSide = "_" + tooltipsConf.side, oldTooltipShowTrigger = tooltipsConf.showTrigger, oldTooltipHideTrigger = tooltipsConf.hideTrigger, oldTooltipClass, oldSize = tooltipsConf.size, oldSpeed = "_" + tooltipsConf.speed;
            $attrs.tooltipSide = $attrs.tooltipSide || tooltipsConf.side;
            $attrs.tooltipShowTrigger = $attrs.tooltipShowTrigger || tooltipsConf.showTrigger;
            $attrs.tooltipHideTrigger = $attrs.tooltipHideTrigger || tooltipsConf.hideTrigger;
            $attrs.tooltipClass = $attrs.tooltipClass || tooltipsConf.class;
            $attrs.tooltipSmart = $attrs.tooltipSmart === "true" || tooltipsConf.smart;
            $attrs.tooltipCloseButton = $attrs.tooltipCloseButton || tooltipsConf.closeButton.toString();
            $attrs.tooltipSize = $attrs.tooltipSize || tooltipsConf.size;
            $attrs.tooltipSpeed = $attrs.tooltipSpeed || tooltipsConf.speed;
            $attrs.tooltipAppendToBody = $attrs.tooltipAppendToBody === "true";
            $transcludeFunc($scope, function onTransclusionDone(element, scope) {
                var attributes = getAttributesToAdd(element), tooltipElement = angular.element(window.document.createElement("tooltip")), tipContElement = angular.element(window.document.createElement("tip-cont")), tipElement = angular.element(window.document.createElement("tip")), tipTipElement = angular.element(window.document.createElement("tip-tip")), closeButtonElement = angular.element(window.document.createElement("span")), tipArrowElement = angular.element(window.document.createElement("tip-arrow")), whenActivateMultilineCalculation = function whenActivateMultilineCalculation() {
                    return tipContElement.html();
                }, calculateIfMultiLine = function calculateIfMultiLine(newValue) {
                    if (newValue !== undefined && tipContElement[0].getClientRects().length > 1) {
                        tooltipElement.addClass("_multiline");
                    } else {
                        tooltipElement.removeClass("_multiline");
                    }
                }, onTooltipShow = function onTooltipShow(event) {
                    tipElement.addClass("_hidden");
                    if ($attrs.tooltipSmart) {
                        switch ($attrs.tooltipSide) {
                          case "top":
                            {
                                if (isOutOfPage(tipElement)) {
                                    tooltipElement.removeClass("_top");
                                    tooltipElement.addClass("_left");
                                    if (isOutOfPage(tipElement)) {
                                        tooltipElement.removeClass("_left");
                                        tooltipElement.addClass("_bottom");
                                        if (isOutOfPage(tipElement)) {
                                            tooltipElement.removeClass("_bottom");
                                            tooltipElement.addClass("_right");
                                            if (isOutOfPage(tipElement)) {
                                                tooltipElement.removeClass("_right");
                                                tooltipElement.addClass("_top");
                                            }
                                        }
                                    }
                                }
                                break;
                            }

                          case "left":
                            {
                                if (isOutOfPage(tipElement)) {
                                    tooltipElement.removeClass("_left");
                                    tooltipElement.addClass("_bottom");
                                    if (isOutOfPage(tipElement)) {
                                        tooltipElement.removeClass("_bottom");
                                        tooltipElement.addClass("_right");
                                        if (isOutOfPage(tipElement)) {
                                            tooltipElement.removeClass("_right");
                                            tooltipElement.addClass("_top");
                                            if (isOutOfPage(tipElement)) {
                                                tooltipElement.removeClass("_top");
                                                tooltipElement.addClass("_left");
                                            }
                                        }
                                    }
                                }
                                break;
                            }

                          case "bottom":
                            {
                                if (isOutOfPage(tipElement)) {
                                    tooltipElement.removeClass("_bottom");
                                    tooltipElement.addClass("_left");
                                    if (isOutOfPage(tipElement)) {
                                        tooltipElement.removeClass("_left");
                                        tooltipElement.addClass("_top");
                                        if (isOutOfPage(tipElement)) {
                                            tooltipElement.removeClass("_top");
                                            tooltipElement.addClass("_right");
                                            if (isOutOfPage(tipElement)) {
                                                tooltipElement.removeClass("_right");
                                                tooltipElement.addClass("_bottom");
                                            }
                                        }
                                    }
                                }
                                break;
                            }

                          case "right":
                            {
                                if (isOutOfPage(tipElement)) {
                                    tooltipElement.removeClass("_right");
                                    tooltipElement.addClass("_top");
                                    if (isOutOfPage(tipElement)) {
                                        tooltipElement.removeClass("_top");
                                        tooltipElement.addClass("_left");
                                        if (isOutOfPage(tipElement)) {
                                            tooltipElement.removeClass("_left");
                                            tooltipElement.addClass("_bottom");
                                            if (isOutOfPage(tipElement)) {
                                                tooltipElement.removeClass("_bottom");
                                                tooltipElement.addClass("_right");
                                            }
                                        }
                                    }
                                }
                                break;
                            }

                          default:
                            {
                                throw new Error("Position not supported");
                            }
                        }
                    }
                    if ($attrs.tooltipAppendToBody) {
                        var tipTipElementStyle = getStyle(tipTipElement[0]), tipArrowElementStyle = getStyle(tipArrowElement[0]), tipElementStyle = getStyle(tipElement[0]), tipElementBoundingClientRect = tipElement[0].getBoundingClientRect(), exradicatedTipElement = angular.copy(tipElement), tipTipStyleIndex = 0, tipTipStyleLength = tipTipElementStyle.length, tipArrowStyleIndex = 0, tipArrowStyleLength = tipArrowElementStyle.length, tipStyleIndex = 0, tipStyleLength = tipElementStyle.length, aStyleKey, tipTipCssToSet = {}, tipCssToSet = {}, tipArrowCssToSet = {}, paddingTopValue, paddingBottomValue, paddingLeftValue, paddingRightValue;
                        tipElement.removeClass("_hidden");
                        exradicatedTipElement.removeClass("_hidden");
                        exradicatedTipElement.data("_tooltip-parent", tooltipElement);
                        removeAppendedTip(tooltipElement);
                        for (;tipTipStyleIndex < tipTipStyleLength; tipTipStyleIndex += 1) {
                            aStyleKey = tipTipElementStyle[tipTipStyleIndex];
                            if (aStyleKey && tipTipElementStyle.getPropertyValue(aStyleKey)) {
                                tipTipCssToSet[aStyleKey] = tipTipElementStyle.getPropertyValue(aStyleKey);
                            }
                        }
                        for (;tipArrowStyleIndex < tipArrowStyleLength; tipArrowStyleIndex += 1) {
                            aStyleKey = tipArrowElementStyle[tipArrowStyleIndex];
                            if (aStyleKey && tipArrowElementStyle.getPropertyValue(aStyleKey)) {
                                tipArrowCssToSet[aStyleKey] = tipArrowElementStyle.getPropertyValue(aStyleKey);
                            }
                        }
                        for (;tipStyleIndex < tipStyleLength; tipStyleIndex += 1) {
                            aStyleKey = tipElementStyle[tipStyleIndex];
                            if (aStyleKey && aStyleKey !== "position" && aStyleKey !== "display" && aStyleKey !== "opacity" && aStyleKey !== "z-index" && aStyleKey !== "bottom" && aStyleKey !== "height" && aStyleKey !== "left" && aStyleKey !== "right" && aStyleKey !== "top" && aStyleKey !== "width" && tipElementStyle.getPropertyValue(aStyleKey)) {
                                tipCssToSet[aStyleKey] = tipElementStyle.getPropertyValue(aStyleKey);
                            }
                        }
                        paddingTopValue = window.parseInt(tipElementStyle.getPropertyValue("padding-top"), 10);
                        paddingBottomValue = window.parseInt(tipElementStyle.getPropertyValue("padding-bottom"), 10);
                        paddingLeftValue = window.parseInt(tipElementStyle.getPropertyValue("padding-left"), 10);
                        paddingRightValue = window.parseInt(tipElementStyle.getPropertyValue("padding-right"), 10);
                        tipCssToSet.top = tipElementBoundingClientRect.top + window.scrollY + "px";
                        tipCssToSet.left = tipElementBoundingClientRect.left + window.scrollX + "px";
                        tipCssToSet.height = tipElementBoundingClientRect.height - (paddingTopValue + paddingBottomValue) + "px";
                        tipCssToSet.width = tipElementBoundingClientRect.width - (paddingLeftValue + paddingRightValue) + "px";
                        exradicatedTipElement.css(tipCssToSet);
                        exradicatedTipElement.children().css(tipTipCssToSet);
                        exradicatedTipElement.children().next().css(tipArrowCssToSet);
                        if (event && $attrs.tooltipHidden !== "true") {
                            exradicatedTipElement.addClass("_exradicated-tooltip");
                            angular.element(window.document.body).append(exradicatedTipElement);
                        }
                    } else {
                        tipElement.removeClass("_hidden");
                        if (event && $attrs.tooltipHidden !== "true") {
                            tooltipElement.addClass("active");
                        }
                    }
                }, onTooltipHide = function onTooltipHide() {
                    if ($attrs.tooltipAppendToBody) {
                        removeAppendedTip(tooltipElement);
                    } else {
                        tooltipElement.removeClass("active");
                    }
                }, registerOnScrollFrom = function registerOnScrollFrom(theElement) {
                    var parentElement = theElement.parent(), timer;
                    if (theElement[0] && (theElement[0].scrollHeight > theElement[0].clientHeight || theElement[0].scrollWidth > theElement[0].clientWidth)) {
                        theElement.on("scroll", function onScroll() {
                            var that = this;
                            if (timer) {
                                $timeout.cancel(timer);
                            }
                            timer = $timeout(function doLater() {
                                var theTipElement = getAppendedTip(tooltipElement), tooltipBoundingRect = tooltipElement[0].getBoundingClientRect(), thatBoundingRect = that.getBoundingClientRect();
                                if (tooltipBoundingRect.top < thatBoundingRect.top || tooltipBoundingRect.bottom > thatBoundingRect.bottom || tooltipBoundingRect.left < thatBoundingRect.left || tooltipBoundingRect.right > thatBoundingRect.right) {
                                    removeAppendedTip(tooltipElement);
                                } else if (theTipElement) {
                                    onTooltipShow(true);
                                }
                            });
                        });
                    }
                    if (parentElement && parentElement.length) {
                        registerOnScrollFrom(parentElement);
                    }
                }, onTooltipTemplateChange = function onTooltipTemplateChange(newValue) {
                    if (newValue) {
                        tooltipElement.removeClass("_force-hidden");
                        tipTipElement.empty();
                        tipTipElement.append(closeButtonElement);
                        tipTipElement.append(newValue);
                        $timeout(function doLaterShow() {
                            onTooltipShow();
                        });
                    } else {
                        tipTipElement.empty();
                        tooltipElement.addClass("_force-hidden");
                    }
                }, onTooltipTemplateUrlChange = function onTooltipTemplateUrlChange(newValue) {
                    if (newValue) {
                        $http.get(newValue).then(function onResponse(response) {
                            if (response && response.data) {
                                tooltipElement.removeClass("_force-hidden");
                                tipTipElement.empty();
                                tipTipElement.append(closeButtonElement);
                                tipTipElement.append($compile(response.data)(scope));
                                $timeout(function doLater() {
                                    onTooltipShow();
                                });
                            }
                        });
                    } else {
                        tipTipElement.empty();
                        tooltipElement.addClass("_force-hidden");
                    }
                }, onTooltipSideChange = function onTooltipSideChange(newValue) {
                    if (newValue) {
                        if (oldTooltipSide) {
                            tooltipElement.removeAttr("_" + oldTooltipSide);
                        }
                        tooltipElement.addClass("_" + newValue);
                        oldTooltipSide = newValue;
                    }
                }, onTooltipShowTrigger = function onTooltipShowTrigger(newValue) {
                    if (newValue) {
                        if (oldTooltipShowTrigger) {
                            tooltipElement.off(oldTooltipShowTrigger);
                        }
                        tooltipElement.on(newValue, onTooltipShow);
                        oldTooltipShowTrigger = newValue;
                    }
                }, onTooltipHideTrigger = function onTooltipHideTrigger(newValue) {
                    if (newValue) {
                        if (oldTooltipHideTrigger) {
                            tooltipElement.off(oldTooltipHideTrigger);
                        }
                        tooltipElement.on(newValue, onTooltipHide);
                        oldTooltipHideTrigger = newValue;
                    }
                }, onTooltipClassChange = function onTooltipClassChange(newValue) {
                    if (newValue) {
                        if (oldTooltipClass) {
                            tipElement.removeClass(oldTooltipClass);
                        }
                        tipElement.addClass(newValue);
                        oldTooltipClass = newValue;
                    }
                }, onTooltipSmartChange = function onTooltipSmartChange() {
                    if (typeof $attrs.tooltipSmart !== "boolean") {
                        $attrs.tooltipSmart = $attrs.tooltipSmart === "true";
                    }
                }, onTooltipCloseButtonChange = function onTooltipCloseButtonChange(newValue) {
                    var enableButton = newValue === "true";
                    if (enableButton) {
                        closeButtonElement.on("click", onTooltipHide);
                        closeButtonElement.css("display", "block");
                    } else {
                        closeButtonElement.off("click");
                        closeButtonElement.css("display", "none");
                    }
                }, onTooltipTemplateControllerChange = function onTooltipTemplateControllerChange(newValue) {
                    if (newValue) {
                        var tipController = $controller(newValue, {
                            $scope: scope
                        }), newScope = scope.$new(false, scope), indexOfAs = newValue.indexOf("as"), controllerName;
                        if (indexOfAs >= 0) {
                            controllerName = newValue.substr(indexOfAs + 3);
                            newScope[controllerName] = tipController;
                        } else {
                            angular.extend(newScope, tipController);
                        }
                        tipTipElement.replaceWith($compile(tipTipElement)(newScope));
                        unregisterOnTooltipControllerChange();
                    }
                }, onTooltipSizeChange = function onTooltipSizeChange(newValue) {
                    if (newValue) {
                        if (oldSize) {
                            tipTipElement.removeClass("_" + oldSize);
                        }
                        tipTipElement.addClass("_" + newValue);
                        oldSize = newValue;
                    }
                }, onTooltipSpeedChange = function onTooltipSpeedChange(newValue) {
                    if (newValue) {
                        if (oldSpeed) {
                            tooltipElement.removeClass("_" + oldSpeed);
                        }
                        tooltipElement.addClass("_" + newValue);
                        oldSpeed = newValue;
                    }
                }, unregisterOnTooltipTemplateChange = $attrs.$observe("tooltipTemplate", onTooltipTemplateChange), unregisterOnTooltipTemplateUrlChange = $attrs.$observe("tooltipTemplateUrl", onTooltipTemplateUrlChange), unregisterOnTooltipSideChangeObserver = $attrs.$observe("tooltipSide", onTooltipSideChange), unregisterOnTooltipShowTrigger = $attrs.$observe("tooltipShowTrigger", onTooltipShowTrigger), unregisterOnTooltipHideTrigger = $attrs.$observe("tooltipHideTrigger", onTooltipHideTrigger), unregisterOnTooltipClassChange = $attrs.$observe("tooltipClass", onTooltipClassChange), unregisterOnTooltipSmartChange = $attrs.$observe("tooltipSmart", onTooltipSmartChange), unregisterOnTooltipCloseButtonChange = $attrs.$observe("tooltipCloseButton", onTooltipCloseButtonChange), unregisterOnTooltipControllerChange = $attrs.$observe("tooltipController", onTooltipTemplateControllerChange), unregisterOnTooltipSizeChange = $attrs.$observe("tooltipSize", onTooltipSizeChange), unregisterOnTooltipSpeedChange = $attrs.$observe("tooltipSpeed", onTooltipSpeedChange), unregisterTipContentChangeWatcher = scope.$watch(whenActivateMultilineCalculation, calculateIfMultiLine);
                closeButtonElement.attr({
                    id: "close-button"
                });
                closeButtonElement.html("&times;");
                tipElement.addClass("_hidden");
                tipTipElement.append(closeButtonElement);
                tipTipElement.append($attrs.tooltipTemplate);
                tipElement.append(tipTipElement);
                tipElement.append(tipArrowElement);
                tipContElement.append(element);
                tooltipElement.attr(attributes);
                tooltipElement.addClass("tooltips");
                tooltipElement.append(tipContElement);
                tooltipElement.append(tipElement);
                $element.after(tooltipElement);
                if ($attrs.tooltipAppendToBody) {
                    resizeObserver.add(function onResize() {
                        registerOnScrollFrom(tooltipElement);
                    });
                    registerOnScrollFrom(tooltipElement);
                }
                resizeObserver.add(function registerResize() {
                    calculateIfMultiLine();
                    onTooltipShow();
                });
                $timeout(function doLater() {
                    onTooltipShow();
                    tipElement.removeClass("_hidden");
                    tooltipElement.addClass("_ready");
                });
                scope.$on("$destroy", function unregisterListeners() {
                    unregisterOnTooltipTemplateChange();
                    unregisterOnTooltipTemplateUrlChange();
                    unregisterOnTooltipSideChangeObserver();
                    unregisterOnTooltipShowTrigger();
                    unregisterOnTooltipHideTrigger();
                    unregisterOnTooltipClassChange();
                    unregisterOnTooltipSmartChange();
                    unregisterOnTooltipCloseButtonChange();
                    unregisterOnTooltipSizeChange();
                    unregisterOnTooltipSpeedChange();
                    unregisterTipContentChangeWatcher();
                    element.off($attrs.tooltipShowTrigger + " " + $attrs.tooltipHideTrigger);
                });
            });
        };
        return {
            restrict: "A",
            transclude: "element",
            priority: 1,
            terminal: true,
            link: linkingFunction
        };
    } ];
    angular.module("720kb.tooltips", []).provider(directiveName + "Conf", tooltipConfigurationProvider).directive(directiveName, tooltipDirective);
})(angular, window);
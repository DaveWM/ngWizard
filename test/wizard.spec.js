describe('wizard directive', function() {
    var element,controllerScope, directiveScope, $compile, $rootScope;

    beforeEach(module("ngWizard"));

    beforeEach(inject(function (_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        controllerScope = $rootScope.$new();
        controllerScope.currentStepNumber = 0;
        controllerScope.requiredText = null;
        controllerScope.submit = function () { };
        controllerScope.stepEntered = function () { };

        controllerScope.dynamicStepTitles = [];
        var rawElement = angular.element('<wizard current-step-number="currentStepNumber" submit="submit()">' +
            '<wizard-step title="step 1" entered="stepEntered()"><p>step 1</p><input type="text" ng-model="requiredText" required /></wizard-step>' +
            '<wizard-step title="step 2" required-step-number="0" entered="stepEntered()"><p>step 2</p></wizard-step>' +
            '<wizard-step title="step 3" entered="stepEntered()"><p>step 3 - no required steps</p></wizard-step>' +
            '<wizard-step title="step 4" required-step-number="999"></wizard-step>' +
            '<wizard-step title="{{title}}" ng-repeat="title in dynamicStepTitles">Title is {{title}} <input type="text" required ng-model="test"/></wizard-step>' +
            '</wizard>');
        element = $compile(rawElement)(controllerScope);
        controllerScope.$apply();
        directiveScope = controllerScope.$$childHead;
    }));

    it("should compile the html correctly", function () {
        expect(element[0].tagName.toLowerCase()).toEqual('wizard');
        expect(element.find('wizard-step').length).toEqual(4);
        expect(controllerScope.currentStepNumber).toBe(0);
        expect(directiveScope.steps.length).toEqual(4);
        expect(directiveScope.steps[0].title).toEqual('step 1');
        expect(element.find('wizard-step').eq(0).find('p').text()).toBe('step 1');
    });

    it("should use the default text for the next, previous and submit buttons by default", function (){
      var scope = $rootScope.$new();
      var rawElem = angular.element('<wizard current-step-number="step"></wizard>');
      var element = $compile(rawElem)(scope);
      scope.$apply();

      expect(element[0].querySelector('.previous a').text).toContain('Previous');
      expect(element[0].querySelector('.next a').text).toContain('Next');
      expect(element[0].querySelector('button.submit').textContent).toContain('Submit');
    });

    it("should use the next, previous and submit text defined in the wizardConfigProvider", inject(function (wizardConfigProvider) {
      wizardConfigProvider.nextString = 'aaa';
      wizardConfigProvider.prevString = 'bbb';
      wizardConfigProvider.submitString = 'ccc';

      var scope = $rootScope.$new();
      var rawElem = angular.element('<wizard current-step-number="step"></wizard>');
      var element = $compile(rawElem)(scope);
      scope.$apply();

      expect(element[0].querySelector('.previous a').text).toContain('bbb');
      expect(element[0].querySelector('.next a').text).toContain('aaa');
      expect(element[0].querySelector('button.submit').textContent).toContain('ccc');
    }));

    it("should enable a step when the step it depends on is complete", function() {
        // fill in required text input in step 0, should then enable step 1
        controllerScope.requiredText = "test";
        controllerScope.$apply();
        expect(directiveScope.getStepState(directiveScope.steps[1])).not.toEqual(directiveScope.stepStatesEnum.disabled);
    });

    it("should enable a step if the required-step-number is invalid", function() {
        expect(directiveScope.getStepState(directiveScope.steps[3])).not.toEqual(directiveScope.stepStatesEnum.disabled);
    });

    it("should always enable steps which don't depend on another step", function () {
        // step 2 has no dependency, should always be enabled
        expect(directiveScope.getStepState(directiveScope.steps[2])).not.toEqual(directiveScope.stepStatesEnum.disabled);
    });

    it("should not be able to navigate to a disabled step", function () {
        // step 1 depends on step 0, so should be disabled
        controllerScope.currentStepNumber = 1;
        controllerScope.$apply();
        // should still be on step 0
        expect(controllerScope.currentStepNumber).toEqual(0);
    });

    it("should only show the active step", function () {
        // step 0 shown
        expect(element.find('wizard-step').find('ng-form').eq(0).hasClass('ng-hide')).toBe(false);
        expect(element.find('wizard-step').find('ng-form').eq(1).hasClass('ng-hide')).toBe(true);
        expect(element.find('wizard-step').find('ng-form').eq(2).hasClass('ng-hide')).toBe(true);

        controllerScope.requiredText = "test";
        controllerScope.$apply();
        controllerScope.currentStepNumber = 1;
        controllerScope.$apply();

        // step 1 shown
        expect(element.find('wizard-step').find('ng-form').eq(0).hasClass('ng-hide')).toBe(true);
        expect(element.find('wizard-step').find('ng-form').eq(1).hasClass('ng-hide')).toBe(false);
        expect(element.find('wizard-step').find('ng-form').eq(2).hasClass('ng-hide')).toBe(true);
    });

    it("should only show the submit button when all steps are complete", function () {
        var submitButton = element.find('button');
        expect(submitButton.hasClass('submit')).toBe(true);
        expect(submitButton.hasClass('ng-hide')).toBe(true);
        expect(directiveScope.isSubmittable()).toBe(false);

        controllerScope.requiredText = "test";
        controllerScope.$apply();
        expect(submitButton.hasClass('ng-hide')).toBe(false);
        expect(directiveScope.isSubmittable()).toBe(true);
    });

    it("should call the submit function on the controller when the submit button is clicked", function() {
        spyOn(directiveScope, "onSubmitClicked").and.callThrough();
        spyOn(controllerScope, "submit").and.returnValue(true);

        controllerScope.requiredText = "test";
        controllerScope.$apply();
        element.find('button')[0].click();
        controllerScope.$apply();

        expect(controllerScope.submit).toHaveBeenCalled();
        expect(directiveScope.onSubmitClicked).toHaveBeenCalled();
    });

    it("should call the entered() function when the user navigates to a step", function () {
        spyOn(controllerScope, "stepEntered");
        controllerScope.requiredText = "test";
        controllerScope.$apply();
        controllerScope.currentStepNumber = 1;
        controllerScope.$apply();

        expect(controllerScope.stepEntered.calls.count()).toEqual(1);

        controllerScope.currentStepNumber = 2;
        controllerScope.$apply();

        expect(controllerScope.stepEntered.calls.count()).toEqual(2);

        directiveScope.goToStep(0);
        directiveScope.$apply();
        expect(controllerScope.stepEntered.calls.count()).toEqual(3);
    });

    it("should not allow a wizard-step tag to be outside a wizard tag", function() {
        var invalidElement = angular.element('<wizard-step title="not valid"></wizard-step>');
        // should throw an exception when we compile the wizard-step element
        expect($compile(invalidElement)).toThrow();
    });

    it("should allow steps to be added dynamically", function () {
        var stepTitle = "dynamically added step";
        controllerScope.dynamicStepTitles.push(stepTitle);
        $rootScope.$apply();

        expect(directiveScope.steps.length).toEqual(5);
        expect(directiveScope.steps[4].title).toEqual(stepTitle);

        controllerScope.dynamicStepTitles = [];
        controllerScope.$apply();

        expect(directiveScope.steps.length).toEqual(4);
    });

    it("should calculate the progress percentage correctly", function() {
        // 1 out of 3 steps complete by default
        expect(directiveScope.getProgressPercentage()).toBeCloseTo(2 * 100 / 4, 5);

        controllerScope.requiredText = "test";
        controllerScope.$apply();

        expect(directiveScope.getProgressPercentage()).toEqual(100);
    });


    it("should correctly determine whether the next/previous buttons are enabled", function () {
        var el = angular.element('<wizard current-step-number="currentStepNumber"> ' +
            '<wizard-step title="step 1"><input type="text" ng-model="step1" required /></wizard-step>' +
            '<wizard-step title="step 2" required-step-number="0"><input type="text" ng-model="step2" required /></wizard-step>' +
            '<wizard-step title="step 3" required-step-number="1"><input type="text" ng-model="step3" required /></wizard-step>' +
            '</wizard>');
        var parentScope = $rootScope.$new();
        parentScope.currentStepNumber = 0;
        $compile(el)(parentScope);
        parentScope.$apply();
        var wizardScope = parentScope.$$childHead;

        // on step 1, steps 2 and 3 should be disabled so next and previous buttons should be disabled
        expect(wizardScope.hasNext()).toBe(false);
        expect(wizardScope.hasPrevious()).toBe(false);

        // complete step 1
        parentScope.step1 = "done";
        parentScope.$apply();

        // should now be able to go next
        expect(wizardScope.hasNext()).toBe(true);
        expect(wizardScope.hasPrevious()).toBe(false);

        // move to step 2
        parentScope.currentStepNumber = 1;
        parentScope.$apply();

        // should now be able to go back, but not forwards (step 3 is disabled)
        expect(wizardScope.hasNext()).toBe(false);
        expect(wizardScope.hasPrevious()).toBe(true);

        // complete step 2
        parentScope.step2 = "done";
        parentScope.$apply();

        // should now be able to go next and previous
        expect(wizardScope.hasNext()).toBe(true);
        expect(wizardScope.hasPrevious()).toBe(true);

        // move to step 3
        parentScope.currentStepNumber = 2;
        parentScope.$apply();

        // should now be able to go back
        expect(wizardScope.hasNext()).toBe(false);
        expect(wizardScope.hasPrevious()).toBe(true);

        // complete step 3
        parentScope.step3 = "done";
        parentScope.$apply();

        // should still only be able to go back
        expect(wizardScope.hasNext()).toBe(false);
        expect(wizardScope.hasPrevious()).toBe(true);
    });
})

# ngWizard [![Build Status](https://travis-ci.org/DaveWM/ngWizard.svg?branch=master)](https://travis-ci.org/DaveWM/ngWizard) [![bitHound Score](https://www.bithound.io/DaveWM/ngWizard/badges/score.svg)](https://www.bithound.io/DaveWM/ngWizard)
ngWizard is an angular directive for creating an animated and reponsive wizard style form, you can see a [demo here](http://embed.plnkr.co/qj3loQYo4QBjcpEKCcEE/preview)
>**Important Note** This directive is not compatible with angular 1.2.x, because of [a bug with nested transclusion](https://github.com/angular/angular.js/issues/6435).
>You need to use angular 1.3.0 or later.

## Installing ngWizard
- Either run `bower install ng-wizard --save`, or download the repo and add `dist/ngWizard.js` and `dist/ngWizard.css` to your project
- Reference `ngWizard.js` and `ngWizard.css` in your HTML, e.g.
```html
<script src="bower_components/ng-wizard/dist/ngWizard.js"></script>
<link rel="stylesheet" href="bower_components/ng-wizard/dist/ngWizard.css">
```
- Add a dependency on the `ngWizard` module to your ng-app module:
```js
angular.module('app',['ngWizard']);
```

## Using the Wizard
ngWizard adds 2 new HTML tags: `<wizard>` and `<wizard-step>`. You use them like this:
``` html
<wizard current-step-number="currentStepNumber" submit="submit()">
  <wizard-step title="step 1" entered="stepEntered()">
    <p>step 1</p>
    <input type="text" ng-model="requiredText" required />
  </wizard-step>
  <wizard-step title="step 2" required-step-number="0" entered="stepEntered()">
    <p>step 2</p>
  </wizard-step>
</wizard>
```
The `<wizard>` element wraps one or more `<wizard-step>` elements.
The wizard will display each step in the order they appear in the HTML.
Each wizard step acts like a form, and a submit button will show only when all steps have been filled out and are valid.
In the above example, the input in step 1 is required, so it must be filled in before you can submit the wizard.

By default, the user can select any step they want straight away, i.e. you can move to a step without completing all previous steps.
If you want the user to complete a step before moving to the next, you can use the `required-step-number` attribute on the `<wizard-step>`.
This will disable the step until the required step is completed.

To localise the text in the previous, next and submit buttons, simply update the `wizardConfigProvider` like so:

```js
angular.module('app', ['ngWizard'])
  .config(function (wizardConfigProvider) {
    wizardConfigProvider.nextString = 'Next';
    wizardConfigProvider.prevString = 'Previous';
    wizardConfigProvider.submitString = 'Submit';
  })
```

### Wizard Attributes

| Attribute | Type | Description |
|-----------|-------|------------|
|`current-step-number`| integer | A reference to the current step number (0 indexed). This must be set. |
|`submit` | function | The function that is called when the submit button is clicked. |

### Wizard Step Attributes

| Attribute | Type | Description |
|-----------|-------|------------|
| `title` | string | The title of the step. |
| `required-step-number` | integer | The step that is required before this step can be navigated to (0 indexed). |
| `entered` | function | Function  to call when this step is entered. |
| `animation` | string | Determines the type animation for entering this step. By default, you can choose `slide`, `zoom` or `fade-in`. If you want to add your own animations, you can add them in css [as in the angular documentation](https://docs.angularjs.org/api/ng/directive/ngShow#animations).|

## Using a custom template

To change how the wizard is displayed, you need to override the `ngWizardTemplate.html` template in `$templateCache`. The default template can be found at `src/ngWizardTemplate.html`. For more information, please see the [angularjs $templateCache documentation.](https://docs.angularjs.org/api/ng/service/$templateCache)

## Dependencies
ngWizard has dependencies on:
- [Font Awesome](http://fortawesome.github.io/Font-Awesome/)
- [Bootstrap](http://getbootstrap.com/)
- The angular `ngAnimate` module

## Contributing
Any suggestions for new features or bug fixes are welcome, and I'll try to review any PRs as quickly as possible.

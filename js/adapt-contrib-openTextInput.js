/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Thomas Eitler <thomas.eitler@learnchamp.com>
 * Barbara Fellner <me@barbarafellner.at>
 * Petra Nussdorfer <petra.nussdorfer@learnchamp.com>
 */

define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    var OpenTextInput = ComponentView.extend({
        events: {
            'click .openTextInput-save-button': 'onSaveClicked',
            'click .openTextInput-clear-button': 'onClearClicked',
            'click .openTextInput-action-button': 'onActionClicked',
            'keyup .openTextInput-item-textbox': 'onKeyUpTextarea'
        },
        preRender: function() {
            this.listenTo(this.model, 'change:_isSaved', this.onSaveChanged);
            this.listenTo(this.model, 'change:_userAnswer', this.onUserAnswerChanged);
            Adapt.router.set('_canNavigate', false, {pluginName:'_openTextInput'});
            this.listenToOnce(Adapt, 'navigation:backButton', this.unsavedChangesNotification);
            if (!this.model.get('_userAnswer')) {
                var userAnswer = this.getUserAnswer();
                if (userAnswer) {
                    this.model.set('_userAnswer', userAnswer);
                }
            }
        },
         unsavedChangesNotification: function() {
                 var promptObject = {
                     title: this.model.get('unsavedChangesNotificationTitle'),
                     body: this.model.get('unsavedChangesNotificationBody'),
                     _prompts: [{
                         promptText: 'Yes',
                         _callbackEvent: '_openTextInput:save',
                     }, {
                         promptText: 'No',
                         _callbackEvent: '_openTextInput:doNotSave'
                     }],
                     _showIcon: true
                 };
                 Adapt.once('_openTextInput:save', function() {
                     this.storeUserAnswer();
                      Adapt.router.set('_canNavigate', true, {pluginName:'_openTextInput'});
                      Adapt.trigger('navigation:backButton');
                 }, this);

                 Adapt.once('_openTextInput:doNotSave', function() {
                   Adapt.router.set('_canNavigate', true, {pluginName:'_openTextInput'});
                   Adapt.trigger('navigation:backButton');
                 }, this);


                 Adapt.trigger('notify:prompt', promptObject);
         },
        postRender: function() {
            //set component to ready
            this.$textbox = this.$('.openTextInput-item-textbox');
            this.countCharacter();
            this.setReadyStatus();
            if (this.model.get('_isComplete')) {
                this.disableButtons();
                this.disableTextarea();
                if (!this.model.get('modelAnswer')) {
                    this.$('.openTextInput-action-button')
                        .prop('disabled', true);
                } else {
                    this.showUserAnswer();
                }
            }
        },
        getUserAnswer: function() {
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';
            var userAnswer = '';

            if (this.supportsHtml5Storage()) {
                userAnswer = localStorage.getItem(identifier);
                if (userAnswer) {
                    return userAnswer;
                }
            } else {
                console.warn('No local storage available');
            }
            return false;
        },
        supportsHtml5Storage: function() {
            // check for html5 local storage support
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },
        countCharacter: function() {
            var charLengthOfTextarea = this.$textbox.val().length;
            var allowedCharacters = this.model.get('_allowedCharacters');
            if (allowedCharacters != null) {
                var charactersLeft = allowedCharacters - charLengthOfTextarea;
                this.$('.openTextInput-count-amount').html(charactersLeft);
            } else {
                this.$('.openTextInput-count-amount').html(charLengthOfTextarea);
            }
        },
        onKeyUpTextarea: function() {
          console.log('onKeyUp');
            this.model.set('_isSaved', false);
            this.onUserAnswerChanged(null, this.$textbox.val());
            this.limitCharacters();
            this.countCharacter();
        },
        limitCharacters: function() {
            var allowedCharacters = this.model.get('_allowedCharacters');
            if (allowedCharacters != null && this.$textbox.val().length > allowedCharacters) {
                var substringValue = this.$textbox.val().substring(0, allowedCharacters);
                this.$textbox.val(substringValue);
            }
        },
        onSaveClicked: function(event) {
            event.preventDefault();
            this.storeUserAnswer();
            this.notifyUserAnswerIsSaved();
        },
        storeUserAnswer: function() {
            // use unique identifier to avoid collisions with other components
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

            if (this.supportsHtml5Storage()) {
                localStorage.setItem(identifier, this.$textbox.val());
            } else {
                console.warn('No local storage available');
            }
            this.model.set('_userAnswer', this.$textbox.val());
            this.model.set('_isSaved', true);
        },
        notifyUserAnswerIsSaved: function() {
            var pushObject = {
                title: '',
                body: this.model.get('savedMessage'),
                _timeout: 2000,
                _callbackEvent: '_openTextInput'
            };
            Adapt.trigger('notify:push', pushObject);
        },
        onSaveChanged: function(model, changedValue) {
            this.$('.openTextInput-save-button').prop('disabled', changedValue);
        },
        onClearClicked: function(event) {
            event.preventDefault();

            var promptObject = {
                title: this.model.get('clearNotificationTitle'),
                body: this.model.get('clearNotificationBody'),
                _prompts: [{
                    promptText: 'Yes',
                    _callbackEvent: '_openTextInput:clearText',
                }, {
                    promptText: 'No',
                    _callbackEvent: '_openTextInput:keepText'
                }],
                _showIcon: true
            };

            Adapt.once('_openTextInput:clearText', function() {
                this.clearTextarea();
                this.onUserAnswerChanged(null, this.$textbox.val());
                this.countCharacter();
            }, this);
            Adapt.trigger('notify:prompt', promptObject);
        },
        clearTextarea: function(event) {
            this.$textbox.val('');
            this.model.set('_isSaved', false);
        },
        onUserAnswerChanged: function(model, changedValue) {
            if (changedValue) {
                this.$('.openTextInput-clear-button, .openTextInput-action-button')
                    .prop('disabled', false);
            } else {
                this.$('.openTextInput-clear-button, .openTextInput-action-button')
                    .prop('disabled', true);
            }
        },
        onActionClicked: function(event) {
            if (this.model.get('_isComplete')) {
                if (this.model.get('_buttonState') == 'model') {
                    this.showUserAnswer();
                } else {
                    this.showModelAnswer();
                }
            } else {
                this.submitAnswer();
            }
        },
        submitAnswer: function() {
            this.storeUserAnswer();
            this.disableButtons();
            this.disableTextarea();
            if (!this.model.get('modelAnswer')) {
                this.$('.openTextInput-action-button')
                    .prop('disabled', true);
            } else {
                this.showUserAnswer();
            }
            this.model.set('_isComplete', true);

            var pushObject = {
                title: '',
                body: this.model.get('submittedMessage'),
                _timeout: 2000,
                _callbackEvent: '_openTextInput:submitted'
            };

            Adapt.trigger('notify:push', pushObject);
        },
        disableTextarea: function() {
            this.$textbox.prop('disabled', true);
        },
        disableButtons: function() {
            this.$('.openTextInput-clear-button, .openTextInput-save-button')
                .prop('disabled', true);
        },
        updateActionButton: function(buttonText) {
            this.$('.openTextInput-action-button')
                .html(buttonText);
        },
        showModelAnswer: function() {
            this.model.set('_buttonState', 'model');
            this.updateActionButton(this.model.get('_buttons').showUserAnswer);
            this.$textbox.val(this.model.get('modelAnswer'));
        },
        showUserAnswer: function() {
            this.model.set('_buttonState', 'user');
            this.updateActionButton(this.model.get('_buttons').showModelAnswer);
            this.$textbox.val(this.model.get('_userAnswer'));
        }
    });

    Adapt.register('openTextInput', OpenTextInput);

});

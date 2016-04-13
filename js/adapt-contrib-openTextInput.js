/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Thomas Eitler <thomas.eitler@learnchamp.com>
 * Barbara Fellner <me@barbarafellner.at>
 * Petra Nussdorfer <petra.nussdorfer@learnchamp.com>
 */

define(function(require) {

  var QuestionView = require('coreViews/questionView');
  var Adapt = require('coreJS/adapt');

  var OpenTextInput = QuestionView.extend({

    events: {
      'keyup .openTextInput-item-textbox': 'onKeyUpTextarea'
    },

    setupQuestion: function() {
      this.listenTo(this.model, 'change:_isSaved', this.onSaveChanged);
      this.listenTo(this.model, 'change:_userAnswer', this.onUserAnswerChanged);
      this.listenToOnce(Adapt, 'navigation:backButton', this.handleBackNavigation);
      this.listenToOnce(Adapt, 'navigation:homeButton', this.handleHomeNavigation);

      if (!this.model.get('_userAnswer')) {
        var userAnswer = this.getUserAnswer();
        if (userAnswer) {
          this.model.set('_userAnswer', userAnswer);
        }
      }
    },

    handleBackNavigation: function() {
      this.model.set('_userAnswer', this.$textbox.val());
      Adapt.trigger('navigation:backButton');
    },

    handleHomeNavigation: function() {
      this.model.set('_userAnswer', this.$textbox.val());
      Adapt.trigger('navigation:homeButton');
    },

    canSubmit: function() {
      var answer = this.$textbox.val();
      return answer && answer.trim() !== '';
    },

    isCorrect: function() {
      return this.canSubmit();
    },

    onQuestionRendered: function() {
      //set component to ready
      this.$textbox = this.$('.openTextInput-item-textbox');
      this.$countChars = this.$('.openTextInput-count-characters');

      this.listenTo(this.buttonsView, 'buttons:submit', this.onActionClicked);
      this.countCharacter();
      this.setReadyStatus();

      if (this.model.get('_isComplete')) {
        this.disableButtons();
        this.disableTextarea();
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
      }

      return false;
    },

    supportsHtml5Storage: function() {
      // check for html5 local storage support
      try {
        return 'localStorage' in window && typeof window['localStorage'] !== 'undefined';
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

    storeUserAnswer: function() {
      // use unique identifier to avoid collisions with other components
      var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

      if (this.supportsHtml5Storage()) {
        localStorage.setItem(identifier, this.$textbox.val());
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

      this.model.set('_isSaved', false);
    },

    onActionClicked: function(event) {
      if (this.model.get('_isComplete')) {
        // Keep it enabled so we can show the model answer,
        // which in this function we are making sure is available.
        if (this.model.get('_buttonState') == 'correct') {
          this.model.set('_buttonState', 'showCorrectAnswer');
        } else {
          this.model.set('_buttonState', 'hideCorrectAnswer');
        }
      }
    },

    submitAnswer: function() {
      this.storeUserAnswer();
      this.disableButtons();
      this.disableTextarea();

      this.setCompletionStatus();

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
        .prop('disabled', true)
        .addClass('disabled');
    },

    updateActionButton: function(buttonText) {
      this.$('.openTextInput-action-button')
        .html(buttonText);
    },

    showCorrectAnswer: function() {
      this.$('.buttons-action').a11y_cntrl_enabled(true);
      this.model.set('_buttonState', 'hideCorrectAnswer');
      this.updateActionButton(this.model.get('_buttons').showUserAnswer);

      var modelAnswer = this.model.get('modelAnswer');
      modelAnswer = modelAnswer.replace(/\\n|&#10;/g, "\n");
      modelAnswer = '<div class="openTextInput-item-modelanswer openTextInput-item-textbox">' + modelAnswer + '</div>';

      this.$textbox.hide();
      this.$countChars.hide();

      this.$textbox.after(modelAnswer);
    },

    hideCorrectAnswer: function() {
      this.$('.buttons-action').a11y_cntrl_enabled(true);
      this.model.set('_buttonState', 'showCorrectAnswer');
      this.updateActionButton(this.model.get('_buttons').showModelAnswer);

      if (this.$textbox === undefined) {
        this.$textbox = this.$('.openTextInput-item-textbox');
      }

      this.$textbox.val(this.model.get('_userAnswer')).show();

      if (this.$countChars === undefined) {
        this.$countChars = this.$('.openTextInput-count-characters');
      }

      this.$countChars.show();

      this.$('.openTextInput-item-modelanswer').remove();
    }
  });

  Adapt.register('openTextInput', OpenTextInput);

});

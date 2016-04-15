/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Brian Quinn <brian@learningpool.com>
 * Barry McCay <barry@learningpool.com>
 */

define(function(require) {

  var QuestionView = require('coreViews/questionView');
  var Adapt = require('coreJS/adapt');

  var OpenTextInput = QuestionView.extend({

    events: {
      'keyup .openTextInput-item-textbox': 'onKeyUpTextarea'
    },

    setupQuestion: function() {
      // this.listenTo(this.model, 'change:_isComplete', this.onCompleteChanged);

      // Disable feedback.
      this.model.set('_canShowFeedback', false);

      if (!this.model.get('_userAnswer')) {
        var userAnswer = this.getUserAnswer();
        if (userAnswer) {
          this.model.set('_userAnswer', userAnswer);
        }
      }
    },

    canSubmit: function() {
      var answer = this.$textbox.val();
      return answer && answer.trim() !== '';
    },

    isCorrect: function() {
      return this.canSubmit();
    },

    onQuestionRendered: function() {
      this.listenTo(this.buttonsView, 'buttons:submit', this.onActionClicked);

      //set component to ready
      this.$textbox = this.$('.openTextInput-item-textbox');
      this.$countChars = this.$('.openTextInput-count-characters');

      this.countCharacters();
      this.setReadyStatus();

      if (this.model.get('_isComplete')) {
        // this.disableButtons();
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

    countCharacters: function() {
      var charLengthOfTextarea = this.$textbox.val().length;
      var allowedCharacters = this.model.get('_allowedCharacters');
      if (allowedCharacters != null) {
        var charactersLeft = allowedCharacters - charLengthOfTextarea;
        this.$('.openTextInput-count-amount').html(charactersLeft);
      } else {
        this.$('.openTextInput-count-amount').html(charLengthOfTextarea);
      }
    },

    onKeyUpTextarea: _.throttle(function() {
      this.limitCharacters();
      var text = this.$textbox.val();
      this.model.set('_userAnswer', text);

      this.countCharacters();
      this.storeUserAnswer();
    }, 300),

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
        localStorage.setItem(identifier, this.model.get('_userAnswer'));
      }

      // this.model.set('_userAnswer', this.$textbox.val());
      this.model.set('_isSaved', true);
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

    disableTextarea: function() {
      this.$textbox.prop('disabled', true);
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
    },

    /**
    * Used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
    */
    getResponse: function() {
      var userAnswer = this.model.get('_userAnswer') || '';

      return userAnswer;
    },

    /**
    * Used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
    */ 
    getResponseType: function() {
        return "fill-in";
    }
  });

  Adapt.register('openTextInput', OpenTextInput);

});

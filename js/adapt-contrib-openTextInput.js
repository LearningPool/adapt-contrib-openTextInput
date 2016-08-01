/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Brian Quinn <brian@learningpool.com>
 * Barry McKay <barry@learningpool.com>
 */

define(function(require) {

  var QuestionView = require('coreViews/questionView');
  var Adapt = require('coreJS/adapt');

  var OpenTextInput = QuestionView.extend({

    events: {
      'keyup .openTextInput-item-textbox': 'onKeyUpTextarea'
    },

    setupQuestion: function() {
      this.listenTo(this.model, 'change:_isComplete', this.onCompleteChanged);

      // Open Text Input cannot show feedback.
      this.model.set('_canShowFeedback', false);

      if (!this.model.get('_userAnswer')) {
        var userAnswer = this.getUserAnswer();
        if (userAnswer) {
          this.model.set('_userAnswer', userAnswer);
        }
      }

      var modelAnswer = this.model.get('modelAnswer');
      modelAnswer = modelAnswer.replace(/\\n|&#10;/g, "\n");

      this.model.set('modelAnswer', modelAnswer);

      if (this.model.get('_isComplete')) {
        
        if (this.model.get('_canShowModelAnswer')) {
          this.model.set('_buttonState', 'showCorrectAnswer');
        } else {
          this.model.set('_buttonState', 'correct');
        }
      } else {
        this.model.set('_buttonState', 'submit');
      }
    },

    onCompleteChanged: function(model, isComplete) {
      this.$textbox.prop('disabled', isComplete);

      if (isComplete) {
        if (model.get('_canShowModelAnswer')) {
          // Keep the action button enabled so we can show the model answer.
          this.$('.buttons-action').a11y_cntrl_enabled(true);

          if (model.get('_buttonState') == 'correct') {
            this.model.set('_buttonState', 'showCorrectAnswer');
          } else {
            this.model.set('_buttonState', 'hideCorrectAnswer');
          }
        }  
      }
    },

    canSubmit: function() {
      var answer = this.$textbox.val();

      if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
          return this.replace(/^\s+|\s+$/g, '');
        }
      }

      return answer && answer.trim() !== '';
    },

    isCorrect: function() {
      return this.canSubmit();
    },

    onQuestionRendered: function() {
      this.listenTo(this.buttonsView, 'buttons:submit', this.onActionClicked);

      this.$textbox = this.$('textarea.openTextInput-item-textbox');
      this.$modelAnswer = this.$('.openTextInput-item-modelanswer');
      this.$countChars = this.$('.openTextInput-count-characters-container');

      this.$autosave = this.$('.openTextInput-autosave');
      this.$autosave.text(this.model.get('savedMessage'));

      this.$autosave.css({opacity: 0});

      this.countCharacters();
      this.setReadyStatus();

      if (this.model.get('_isComplete') && !this.model.get('_canShowModelAnswer')) {
        // Model answer has been disabled.
        // Force setting the correct/submitted state.
        this.model.set('_buttonState', 'correct');
        this.$('.buttons-action').a11y_cntrl_enabled(false);
        this.$textbox.prop('disabled', true);
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

      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      var self = this;
      this.saveTimeout = setTimeout(function() {
        self.storeUserAnswer();
      }, 2000);

    }, 300),

    limitCharacters: function() {
      var allowedCharacters = this.model.get('_allowedCharacters');
      if (allowedCharacters != null && this.$textbox.val().length > allowedCharacters) {
        var substringValue = this.$textbox.val().substring(0, allowedCharacters);
        this.$textbox.val(substringValue);
      }
    },

    storeUserAnswer: function() {
      // Use unique identifier to avoid collisions with other components
      var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

      if (this.supportsHtml5Storage()) {
        // Adding a try-catch here as certain browsers, e.g. Safari on iOS in Private mode,
        // report as being able to support localStorage but fail when setItem() is called.
        try {
          localStorage.setItem(identifier, this.model.get('_userAnswer'));
        } catch (e) {
          console.log('ERROR: HTML5 localStorage.setItem() failed! Unable to save user answer.');
        }
      }

      this.model.set('_isSaved', true);

      this.$autosave.css({opacity: 100});
      this.$autosave.delay(1000).animate({opacity: 0});
    },

    onActionClicked: function(event) {
      if (this.model.get('_isComplete')) {
        this.onCompleteChanged(this.model, true);
      }
    },

    updateActionButton: function(buttonText) {
      // Keep the action button enabled so we can show the model answer
      this.$('.buttons-action').a11y_cntrl_enabled(true);

      this.$('.openTextInput-action-button').html(buttonText);
    },

    postRender: function() {
      // Set the height of the textarea to the height of the model answer.
      // This creates a smoother user experience
      this.$('.openTextInput-item-textbox').height(this.$('.openTextInput-item-modelanswer').height());
      this.$('.openTextInput-item-modelanswer').addClass('hide-openTextInput-modelanswer');
      this.$('.openTextInput-count-characters').height(this.$('.openTextInput-count-characters').height());

      QuestionView.prototype.postRender.call(this);
    },

    showCorrectAnswer: function() {
      this.model.set('_buttonState', 'hideCorrectAnswer');
      this.updateActionButton(this.model.get('_buttons').showUserAnswer);

      this.$textbox.hide();
      this.$countChars.hide();
      this.$modelAnswer.addClass('show-openTextInput-modelanswer').removeClass('hide-openTextInput-modelanswer');
    },

    hideCorrectAnswer: function() {
      this.model.set('_buttonState', 'showCorrectAnswer');
      this.updateActionButton(this.model.get('_buttons').showModelAnswer);

      if (this.$textbox === undefined) {
        this.$textbox = this.$('textarea.openTextInput-item-textbox');
      }

      if (this.$modelAnswer === undefined) {
        this.$modelAnswer = this.$('.openTextInput-item-modelanswer');
      }

      this.$textbox.val(this.model.get('_userAnswer')).show();

      if (this.$countChars === undefined) {
        this.$countChars = this.$('.openTextInput-count-characters-container');
      }

      this.$countChars.show();
      this.$modelAnswer.addClass('hide-openTextInput-modelanswer').removeClass('show-openTextInput-modelanswer');
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
      return "long-fill-in";
    }
  });

  Adapt.register('openTextInput', OpenTextInput);

});

/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Brian Quinn <brian@learningpool.com>
 * Barry McKay <barry@learningpool.com>
 */

define([
  'core/js/adapt',
  'core/js/views/questionView',
  'core/js/enums/buttonStateEnum'
], function(Adapt, QuestionView, BUTTON_STATE) {

  class OpenTextInput extends QuestionView {

    events() {
        return {
        'keyup .opentextinput__item-textbox': 'onKeyUpTextarea'
      }
    }

    formatPlaceholder() {
      // Replace quote marks in placholder.
      var placeholder = this.model.get('placeholder') || '';

      placeholder = placeholder.replace(/"/g, '\'');

      this.model.set('placeholder', placeholder);
    }

    setupQuestion() {
      this.listenTo(this.model, 'change:_isComplete', this.onCompleteChanged);

      // Open Text Input cannot show feedback, but may have been set in older courses
      this.model.set('_canShowFeedback', false);
      this.model.set('_feedback', {});

      this.formatPlaceholder();

      if (!this.model.get('_userAnswer')) {
        var userAnswer = this.getUserAnswer();
        if (userAnswer) {
          this.model.set('_userAnswer', userAnswer);
        }
      }

      var modelAnswer = this.model.get('modelAnswer');

      modelAnswer = modelAnswer ? modelAnswer.replace(/\\n|&#10;/g, '\n') : '';

      this.model.set('modelAnswer', modelAnswer);

      if (this.model.get('_isComplete')) {
        if (this.model.get('_canShowModelAnswer')) {
          this.model.set('_buttonState', BUTTON_STATE.SHOW_CORRECT_ANSWER);
        } else {
          this.model.set('_buttonState', BUTTON_STATE.CORRECT);
        }
      } else {
        this.model.set('_buttonState', BUTTON_STATE.SUBMIT);
      }

      // Some shim code to handle old/missing JSON.
      var buttons = this.model.get('_buttons');

      if (buttons['_hideCorrectAnswer'] == undefined) {
        buttons._hideCorrectAnswer = buttons._showUserAnswer || 'Show User Answer';
      }

      if (buttons['_showCorrectAnswer'] == undefined) {
        buttons._showCorrectAnswer = buttons._showModelAnswer || 'Show Model Answer';
      }

      this.model.set('_buttons', buttons);
    }

    onCompleteChanged(model, isComplete, buttonState) {
      this.$textbox.prop('disabled', isComplete);
      this.$answer.html(model.get('_userAnswer').replace(/\n/g, '<br>'));

      if (isComplete) {
        if (model.get('_canShowModelAnswer')) {
          // Keep the action button enabled so we can show the model answer.
          this.$('.btn__action').a11y_cntrl_enabled(true);

          if (!_.isEmpty(buttonState)) {
            // Toggle the button.
            if (buttonState == BUTTON_STATE.CORRECT || buttonState == BUTTON_STATE.HIDE_CORRECT_ANSWER || buttonState == BUTTON_STATE.SUBMIT) {
              this.model.set('_buttonState', BUTTON_STATE.SHOW_CORRECT_ANSWER);
            } else {
              this.model.set('_buttonState', BUTTON_STATE.HIDE_CORRECT_ANSWER);
            }
          }
        }
      }
    }

    canSubmit() {
      var answer = this.model.get('_userAnswer');

      if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
          return this.replace(/^\s+|\s+$/g, '');
        };
      }

      return answer && answer.trim() !== '';
    }

    isCorrect() {
      return this.canSubmit();
    }

    onQuestionRendered() {
      this.listenTo(this.buttonsView, 'buttons:stateUpdate', this.onActionClicked);

      if (this.$textbox === undefined) {
        this.$textbox = this.$('textarea.opentextinput__item-textbox');
      }

      this.$modelAnswer = this.$('.opentextinput__item-modelanswer');
      this.$countChars = this.$('.opentextinput__count-characters-container');

      this.$autosave = this.$('.opentextinput__autosave');
      this.$autosave.text(this.model.get('savedMessage'));

      this.$autosave.css({ opacity: 0 });

      this.countCharacters();
      this.setReadyStatus();

      if (this.model.get('_isComplete') && !this.model.get('_canShowModelAnswer')) {
        // Model answer has been disabled.
        // Force setting the correct/submitted state.
        this.model.set('_buttonState', BUTTON_STATE.CORRECT);
        this.$('.btn__action').a11y_cntrl_enabled(false);
        this.$textbox.prop('disabled', true);
      }
    }

    getUserAnswer() {
      var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';
      var userAnswer = '';

      if (this.supportsHtml5Storage() && !this.model.get('_isResetOnRevisit')) {
        userAnswer = localStorage.getItem(identifier);
        if (userAnswer) {
          return userAnswer;
        }
      }

      return false;
    }

    supportsHtml5Storage() {
      // check for html5 local storage support
      try {
        return 'localStorage' in window && typeof window['localStorage'] !== 'undefined';
      } catch (e) {
        return false;
      }
    }

    countCharacters() {
      var charLengthOfTextarea = this.$textbox.val().length;
      var allowedCharacters = this.model.get('_allowedCharacters');
      if (allowedCharacters != null) {
        var charactersLeft = allowedCharacters - charLengthOfTextarea;
        this.$('.opentextinput__count-amount').html(charactersLeft);
      } else {
        this.$('.opentextinput__count-amount').html(charLengthOfTextarea);
      }
    }

    onKeyUpTextarea() {
      var countandLimitCharacters = _.throttle(() => {
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
      }, 300);

      countandLimitCharacters();
    }

    limitCharacters() {
      var allowedCharacters = this.model.get('_allowedCharacters');
      if (allowedCharacters != null && this.$textbox.val().length > allowedCharacters) {
        var substringValue = this.$textbox.val().substring(0, allowedCharacters);
        this.$textbox.val(substringValue);
      }
    }

    storeUserAnswer() {
      // Use unique identifier to avoid collisions with other components
      var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

      if (this.supportsHtml5Storage() && !this.model.get('_isResetOnRevisit')) {
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
    }

    onActionClicked(buttonState) {
      if (this.model.get('_isComplete')) {
        this.onCompleteChanged(this.model, true, buttonState);
      }
    }

    postRender() {
      if (this.$('.opentextinput__item-modelanswer').height() <= 0) {
        this.$('.opentextinput__item-textbox, .opentextinput__count-characters').css('height', 'auto');
      } else {
        // Set the height of the textarea to the height of the model answer.
        // This creates a smoother user experience
        this.$('.opentextinput__item-textbox').height(this.$('.opentextinput__item-modelanswer').height());
        this.$('.opentextinput__count-characters').height(this.$('.opentextinput__count-characters').height());
      }

      this.$('.opentextinput__item-modelanswer').addClass('opentextinput__hide-modelanswer');

      QuestionView.prototype.postRender.call(this);
    }

    showCorrectAnswer() {
      this.model.set('_buttonState', BUTTON_STATE.HIDE_CORRECT_ANSWER);
      
      this.$textbox.hide();
      this.$countChars.hide();
      this.$modelAnswer.addClass('opentextinput__show-modelanswer').removeClass('opentextinput__hide-modelanswer');

      this.scrollToTextArea();
    }

    hideCorrectAnswer() {
      this.model.set('_buttonState', BUTTON_STATE.SHOW_CORRECT_ANSWER);
      
      if (this.$textbox === undefined) {
        this.$textbox = this.$('textarea.opentextinput__item-textbox');
      }

      if (this.$modelAnswer === undefined) {
        this.$modelAnswer = this.$('.opentextinput__item-modelanswer');
      }
    }

    toggleAnswer(buttonState, buttonKey, answerKey) {
      this.model.set('_buttonState', buttonState);
      this.updateActionButton(buttonKey);

      if (this.$countChars === undefined) {
        this.$countChars = this.$('.opentextinput__count-characters-container');
      }

      this.$countChars.show();
      this.$modelAnswer.addClass('opentextinput__hide-modelanswer').removeClass('opentextinput__show-modelanswer');
    }

    scrollToTextArea() {
      // Smooth scroll to top of TextArea
      Adapt.scrollTo(this.$('.opentextinput__widget'), {
        duration: 400,
        offset: -parseInt($('#wrapper').css('padding-top'))
      });
    }

    /**
     * Used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
     */
    getResponse() {
      return this.model.get('_userAnswer') || '';
    }

    /**
     * Used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
     */
    getResponseType() {
      return 'fill-in';
    }

    getInteractionObject() {
      return {
        correctResponsesPattern: [
          this.model.get('modelAnswer')
        ]
      };
    }

    /**
     * Used by questionView. Clears the models on Revisit userAnswer so input appears blank
     */
    resetQuestionOnRevisit() {
      this.resetQuestion();
    }

    /**
     * Used by questionView. Clears the models userAnswer onResetClicked so input appears blank
     */
    resetQuestion() {
      this.model.set('_userAnswer', '');

      if (this.$textbox === undefined) {
        this.$textbox = this.$('textarea.opentextinput__item-textbox');
      }

      this.$textbox.val(this.model.get('_userAnswer'));
    }
  };

  Adapt.register('openTextInput', OpenTextInput);

  Adapt.once('adapt:start', restoreQuestionStatusPolyfill);

  /**
   * Spoor cannot store text input values and so the completion status of this component does not get
   * saved or restored properly. This function ensures that the question's completion status is
   * restored in a way that other extensions e.g. learning objectives can obtain accurate data for processing
   *
   */
  function restoreQuestionStatusPolyfill() {
    Adapt.components.each(function(component) {
      if (component.get('_component') !== 'openTextInput') {
        return;
      }

      // If the component is complete then it must be correct
      // _isInteractionComplete needs to be set to true so marking is restored correctly
      if (component.get('_isComplete')) {
        component.set({
          _isCorrect: true,
          _isInteractionComplete: true
        });

        // Add a manual trigger just in case any extensions listening for this change have already loaded
        component.trigger('change:_isComplete', component, true);
      }
    });
  }

  return OpenTextInput;

});

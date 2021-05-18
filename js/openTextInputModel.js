/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Brian Quinn <brian@learningpool.com>
 * Barry McKay <barry@learningpool.com>
 */

define([
  'core/js/models/questionModel',
  'core/js/enums/buttonStateEnum'
], function(QuestionModel, BUTTON_STATE) {

  class OpenTextInputModel extends QuestionModel {

    formatPlaceholder() {
      // Replace quote marks in placeholder.
      let placeholder = this.get('placeholder') || '';
      placeholder = placeholder.replace(/"/g, '\'');

      this.set('placeholder', placeholder);
    }

    setupQuestion(localUserAnswer) {
      // Open Text Input cannot show feedback, but may have been set in older courses
      this.set('_canShowFeedback', false);
      this.set('_feedback', {});

      this.formatPlaceholder();

      if (!this.getUserAnswer()) {
        const userAnswer = localUserAnswer;
        if (userAnswer) {
          this.setUserAnswer(userAnswer);
        }
      }

      let modelAnswer = this.get('modelAnswer');
      modelAnswer = modelAnswer ? modelAnswer.replace(/\\n|&#10;/g, '\n') : '';

      this.set('modelAnswer', modelAnswer);

      if (this.get('_isComplete')) {
        if (this.get('_canShowModelAnswer')) {
          this.set('_buttonState', BUTTON_STATE.SHOW_CORRECT_ANSWER);
        } else {
          this.set('_buttonState', BUTTON_STATE.CORRECT);
        }
      } else {
        this.set('_buttonState', BUTTON_STATE.SUBMIT);
      }

      // Some shim code to handle old/missing JSON.
      const buttons = this.get('_buttons');

      if (buttons['_hideCorrectAnswer'] == undefined) {
        buttons._hideCorrectAnswer = buttons._showUserAnswer || 'Show User Answer';
      }

      if (buttons['_showCorrectAnswer'] == undefined) {
        buttons._showCorrectAnswer = buttons._showModelAnswer || 'Show Model Answer';
      }

      this.set('_buttons', buttons);
    }

    getUserAnswer() {
      return this.get('userAnswer') || '';
    }

    setUserAnswer(userAnswer) {
      this.set('userAnswer', userAnswer);
    }

    canSubmit() {
      const answer = this.getUserAnswer()
      return answer && answer.trim() !== '';
    }

    isCorrect() {
      return this.canSubmit();
    }

    /**
     * Used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
     */
    getResponse() {
      return this.getUserAnswer()
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
          this.get('modelAnswer')
        ]
      };
    }
  };

  return OpenTextInputModel;

});
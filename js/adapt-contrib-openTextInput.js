/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Brian Quinn <brian@learningpool.com>
 * Barry McKay <barry@learningpool.com>
 */

define([
  'core/js/adapt',
  './openTextInputModel',
  './openTextInputView',
], function(Adapt, OpenTextInputModel, OpenTextInputView) {

  Adapt.once('adapt:start', restoreQuestionStatusPolyfill);

  return Adapt.register('openTextInput', {
    view: OpenTextInputView,
    model: OpenTextInputModel
  });

  /**
   * Spoor cannot store text input values and so the completion status of this component does not get
   * saved or restored properly. This function ensures that the question's completion status is
   * restored in a way that other extensions e.g. learning objectives can obtain accurate data for processing
   */
  function restoreQuestionStatusPolyfill() {
    Adapt.components.each(function(component) {
      if (component.get('_component') !== 'openTextInput') return;

      if (!component.get('_isComplete')) return;

      // If the component is complete then it must be correct
      // _isInteractionComplete needs to be set to true so marking is restored correctly
      component.set({
        _isCorrect: true,
        _isInteractionComplete: true
      });

      // Add a manual trigger just in case any extensions listening for this change have already loaded
      component.trigger('change:_isComplete', component, true);
    });
  }

});

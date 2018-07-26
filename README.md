#adapt-contrib-openTextInput

An Adapt core contributed openTextInput component that allows the user to answer a open question.

##Installation

First, be sure to install the [Adapt Command Line Interface](https://github.com/adaptlearning/adapt-cli), then from the command line run:-

        adapt install adapt-contrib-openTextInput

This component can also be installed by adding the component to the adapt.json file before running `adapt install`:

        "adapt-contrib-openTextInput": "*"

##Usage

Once installed, the component can be used to ask the user open questions.

##Settings overview

For example JSON format, see [example.json](https://github.com/adaptlearning/adapt-contrib-narrative/blob/master/example.json). A description of the core settings can be found at: [Core model attributes](https://github.com/adaptlearning/adapt_framework/wiki/Core-model-attributes).

Further settings for this component are:

####_component

This value must be: `openTextInput`

####_classes

You can use this setting to add custom classes to your template and LESS file.

####_layout

This defines the position of the component in the block. Values can be `full`, `left` or `right`. 

####title

This value is the title for the openTextInput element. This is mandatory, but will not be displayed.

####displayTitle

This value is the displayed title for the openTextInput element. This is optional and will be displayed.

####body

This is the main text for the openTextInput.

####placeholder

This value will be displayed if no text has been inserted to the textarea.

####_allowedCharacters

The amount of characters the user is allowed to write in the textarea. If there is no limit value should be 'null'. If so, it will count how much characters the user has already been written.

####characterCountText

This value is the text before the limited or counted characters.

####_numberOfRows

Defines the height of the textarea with numbers starting by 1.

###_isResetOnRevisit

Flag to set whether the text field should be cleared with reset/retry assessment. Default false

####modelAnswer

This value is the best practise answer. The user can compare this answer to his one.

####savedMessage

The message the user gets, when he saves his text.

####submittedMessage

The message the user gets, when he submittes his text.

####_buttons

The value of the buttons

#####save

This value is displayed at the save button.

#####submit

This value is displayed at the submit button.

#####showModelAnswer

This value is displayed on the showModelAnswer Button.

#####showUserAnswer

This value is displayed on the showUserAnswer Button.

#####clear

This value is displayed on the clear Button.

##Limitations
 
To be completed.

##Browser spec

This component has been tested to the standard Adapt browser specification.

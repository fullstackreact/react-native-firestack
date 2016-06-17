#!/bin/sh

# HACK
# https://github.com/facebook/react-native/issues/637

cp -R Example/ios/Pods/ .
mv Pods.xcodeproj Firestack.xcodeproj

# echo <<-EOE
# # Uncomment this line to define a global platform for your project
# platform :ios, '8.0'
#
# target 'Example' do
#   # Uncomment this line if you're using Swift or would like to use dynamic frameworks
#   use_frameworks!
#
#   # Pods for Example
#   pod 'React', :path => '../node_modules/react-native'
#   pod 'Firestack', :path => './'
#
#   target 'ExampleTests' do
#     inherit! :search_paths
#     # Pods for testing
#   end
#
# end
# EOE > ./Podfile

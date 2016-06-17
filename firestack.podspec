require 'json'
package = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|

  # s.name             = 'react-native-firestack'
  s.name            = 'Firestack'
  s.version         = package['version']
  s.homepage        = "https://github.com/fullstackreact/react-native-firestack"
  s.summary         = "A Firebase v3 implementation for react-native"
  # s.license         = { :type => package['license'], :file => 'LICENSE' },
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author          = package['author']
  s.platform        = :ios, "8.0"
  s.source          = { :git => package['repository']['url'], :tag => 'master' }
  # s.source           = { :git => 'https://github.com/fullstackreact/react-native-firestack.git', :tag => s.version.to_s }
  s.source_files    = 'ios/**/*.{h,m}'
  s.public_header_files = 'ios/**/*.h'
  s.preserve_paths  = "**/*.js"

# This description is used to generate tags and improve search results.
#   * Think: What does it do? Why did you write it? What is the focus?
#   * Try to keep it short, snappy and to the point.
#   * Write the description between the DESC delimiters below.
#   * Finally, don't worry about the indent, CocoaPods strips it!

  s.description      = <<-DESC
Make it easy to work with the new Firebase and React-Native.
Currently, this is best installed through npm:

    npm install --save react-native-firestack
                       DESC

  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'

  s.social_media_url = 'https://twitter.com/fullstackreact'
  s.ios.deployment_target = '8.0'

  # s.source_files = 'ios/Classes/**/*'

  # s.resource_bundles = {
  #   'react-native-firestack' => ['react-native-firestack/Assets/*.png']
  # }

  s.frameworks = 'UIKit'
  # s.dependency 'AFNetworking', '~> 2.3'
  s.dependency 'React/Core'
  # s.libraries       = 'stdc++'

  s.subspec 'Firebase' do |ss|
    [ 'Firebase/Core',
      'Firebase/Analytics',
      'Firebase/Auth',
      'Firebase/Database',
      'Firebase/Storage'
    ].each do |lib|
      ss.dependency lib
    end
  end

  s.subspec 'Core' do |ss|
    ## Don't install Firebase, i.e.:
    # pod 'react-native-firestack/Core'
  end
end

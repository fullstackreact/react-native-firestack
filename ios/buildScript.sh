#!/bin/sh

#  buildScript.sh
#  Firestack
#
#  Created by Ari Lerner on 8/3/16.
#  Copyright © 2016 Facebook. All rights reserved.
frameworks="Firebase FirebaseAnalytics"

source "${SRCROOT}/Pods/Target Support Files/Pods-Firestack/Pods-Firestack-frameworks.sh"
FRAMEWORKS_FOLDER_PATH=""

for framework in $frameworks
do

install_framework "${SRCROOT}/Pods/$framework"

done

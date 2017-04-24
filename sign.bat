cd platforms\android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore tromboy.keystore build\outputs\apk\android-release-unsigned.apk tromboy
cd build\outputs\apk
"C:\Program Files (x86)\Android\android-sdk\build-tools\25.0.2\zipalign" -v 4 android-release-unsigned.apk tromboy.apk
explorer .

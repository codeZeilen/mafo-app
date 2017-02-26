# ionic build android --release
ARCH=$1
VERSION=$2
cp platforms/android/build/outputs/apk/android-${ARCH}-release-unsigned.apk ../mafo-app-package/mf-new-${ARCH}-alpha-signed.apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../mafo-app-package/apps.keystore ../mafo-app-package/mf-new-${ARCH}-alpha-signed.apk mafo
rm ../mafo-app-package/${VERSION}-mf-new-${ARCH}-alpha-signed-aligned.apk
/home/patrick/Programs/adt-bundle-linux-x86-20131030/sdk/build-tools/25.0.2/zipalign 4 ../mafo-app-package/mf-new-${ARCH}-alpha-signed.apk ../mafo-app-package/${VERSION}-mf-new-${ARCH}-alpha-signed-aligned.apk

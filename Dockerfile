# Étape 1 : Base Java + Android SDK
FROM openjdk:11 as build

# Variables d’environnement Android
ENV ANDROID_SDK_ROOT=/sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/tools/bin:$ANDROID_SDK_ROOT/platform-tools

# Installer le SDK Android
RUN apt-get update && apt-get install -y curl unzip git build-essential \
    && mkdir -p $ANDROID_SDK_ROOT \
    && curl -sSL https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -o cmdline-tools.zip \
    && unzip cmdline-tools.zip -d $ANDROID_SDK_ROOT \
    && mv $ANDROID_SDK_ROOT/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools-tmp \
    && mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/latest \
    && mv $ANDROID_SDK_ROOT/cmdline-tools-tmp/* $ANDROID_SDK_ROOT/cmdline-tools/latest/ \
    && yes | sdkmanager --licenses \
    && sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"

# Copie du projet
WORKDIR /app
COPY . .

# Assure-toi que gradlew est exécutable
RUN chmod +x android/gradlew

# Lancer le build
WORKDIR /app/android
RUN ./gradlew assembleRelease
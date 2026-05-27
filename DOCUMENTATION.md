# Documentation Académique et Pédagogique : Projet ShakeAuth 📱🛡️

Bienvenue dans la documentation officielle de référence du projet **ShakeAuth**. Ce document est conçu comme un guide pédagogique complet et académique, destiné aux étudiants et développeurs débutant dans l'écosystème **React Native**. 

Ce projet sert de cas d'école parfait pour comprendre l'intégration entre le monde JavaScript (React Native) et le monde natif (Android en Kotlin, iOS en Swift/Objective-C), l'utilisation des capteurs physiques (accéléromètre), l'authentification biométrique et la mise en place d'un pipeline d'Intégration Continue (CI/CD).

---

## Table des Matières
1. [Architecture Globale de React Native & Concepts Clés](#1-architecture-globale-de-react-native--concepts-clés)
2. [Structure et Cartographie Complète du Projet](#2-structure-et-cartographie-complète-du-projet)
3. [Deep Dive : Analyse Détaillée des Fichiers Clés](#3-deep-dive--analyse-détaillée-des-fichiers-clés)
   * [3.1. Le Niveau JavaScript / React Native (`App.tsx` et `index.js`)](#31-le-niveau-javascript--react-native-apptsx-et-indexjs)
   * [3.2. Le Niveau Natif Android (`MainActivity.kt` et `MainApplication.kt`)](#32-le-niveau-natif-android-mainactivitykt-et-mainapplicationkt)
   * [3.3. Le Niveau Natif iOS (`AppDelegate.swift` et `ShakeEventEmitter.m`)](#33-le-niveau-natif-ios-appdelegateswift-et-shakeeventemitterm)
   * [3.4. Le Niveau CI/CD Automatisé (`build.yml`)](#34-le-niveau-cicd-automatisé-buildyml)
4. [Synthèse Pédagogique pour les Étudiants](#4-synthèse-pédagogique-pour-les-étudiants)

---

## 1. Architecture Globale de React Native & Concepts Clés

Pour bien comprendre ce projet, il faut assimiler comment fonctionne React Native sous le capot.

### Le Bridge (Pont) vs La Nouvelle Architecture (TurboModules / Fabric)
Traditionnellement, React Native fait tourner le code JavaScript dans un thread séparé (le **JS Thread**). Pour interagir avec l'interface utilisateur native (le **UI Thread**) ou les fonctionnalités système (appareil photo, accéléromètre), React Native utilise un **Pont (Bridge)** asynchrone et sérialisé en JSON.

Dans notre application :
* Le secouement (shake) est détecté directement par le système natif (Android/iOS).
* L'événement natif est sérialisé et envoyé via le Pont (ou via TurboModules/Event Emitters) vers le JavaScript.
* Le code JavaScript met à jour l'état (`state`), ce qui demande à l'interface de se redessiner.

### Cycle de vie d'un composant, State et Props
* **State (État)** : Représente les données locales internes à un composant qui peuvent changer au cours du temps (ex: le nombre de secousses `count`, l'état d'authentification `auth`). Chaque modification du `state` déclenche un nouveau rendu de l'interface utilisateur.
* **Props (Propriétés)** : Données transmises par un composant parent à un composant enfant (immutables pour l'enfant).
* **useEffect** : Hook React permettant de gérer les "effets de bord" (side-effects), comme l'écoute d'événements natifs ou la souscription à des capteurs.

---

## 2. Structure et Cartographie Complète du Projet

Voici le rôle précis de chaque fichier important du projet :

| Fichier / Dossier | Rôle Pédagogique |
| :--- | :--- |
| **`index.js`** | Point d'entrée principal de l'application JavaScript. Enregistre le composant racine. |
| **`App.tsx`** | Code source de l'interface utilisateur (UI), de la logique d'état et de l'intégration biométrique. |
| **`package.json`** | Métadonnées du projet, dépendances NPM (ex: `react-native-biometrics`) et scripts de build. |
| **`tsconfig.json`** | Configuration du compilateur TypeScript (règles de typage). |
| **`metro.config.js`** | Configuration de Metro, le bundler JavaScript qui compile le JS pour l'application mobile. |
| **`babel.config.js`** | Configuration de Babel, qui transpile le JavaScript moderne/TSX en JavaScript compatible. |
| **`android/`** | Projet natif Android complet (compilable via Android Studio / Gradle). |
| **`android/app/src/main/java/com/shakeauth/MainActivity.kt`** | Activité principale Android. Gère les capteurs physiques (accéléromètre) et émet les secousses. |
| **`android/app/src/main/java/com/shakeauth/MainApplication.kt`** | Point d'entrée de l'application Android. Initialise React Native et charge les packages. |
| **`ios/`** | Projet natif iOS complet (compilable via Xcode / CocoaPods). |
| **`ios/ShakeAuth/AppDelegate.swift`** | Délégué d'application iOS. Intercepte le geste de secouement global sur l'écran (`motionShake`). |
| **`ios/ShakeAuth/ShakeEventEmitter.m`** | Module natif Objective-C. Pont qui émet l'événement de secouement d'iOS vers JavaScript. |
| **`.github/workflows/build.yml`** | Script de pipeline d'Intégration Continue (GitHub Actions) qui compile automatiquement les APKs Android. |

---

## 3. Deep Dive : Analyse Détaillée des Fichiers Clés

---

### 3.1. Le Niveau JavaScript / React Native (`App.tsx` et `index.js`)

#### A. `index.js`
C'est la porte d'entrée de l'application. Elle est très courte mais cruciale.
```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```
* **`AppRegistry`** : C'est le point d'entrée JS pour exécuter toutes les applications React Native.
* **`registerComponent`** : Enregistre le composant `App` auprès du système natif sous le nom de l'application (`appName` issu de `app.json`). C'est ce qui permet au moteur natif de charger notre code JavaScript.

#### B. `App.tsx`
C'est le cœur de la logique utilisateur et de l'interface graphique.

##### 1. Fonctions Utilitaires (Hors du Composant)
```typescript
function getDayNumber() {
  var day = new Date().getDay();
  return day === 0 ? 7 : day;
}
```
* **Rôle** : Récupère le numéro du jour actuel (1 pour Lundi, 7 pour Dimanche). La méthode native de JS `getDay()` renvoie `0` pour le dimanche ; cette fonction harmonise le dimanche à `7`.

```typescript
function getRequiredShakes() {
  var d = getDayNumber();
  return (d * d) % 5;
}
```
* **Rôle** : Formule mathématique dynamique déterministe qui définit le nombre de secousses nécessaires pour déverrouiller l'application en fonction du jour de la semaine ($d^2 \pmod 5$).
  * Lundi ($1$) $\rightarrow 1$ secousse.
  * Mardi ($2$) $\rightarrow 4$ secousses.
  * Mercredi ($3$) $\rightarrow 4$ secousses.
  * Jeudi ($4$) $\rightarrow 1$ secousse.
  * Vendredi ($5$) $\rightarrow 0$ secousse (déverrouillé d'office).
  * Samedi ($6$) $\rightarrow 1$ secousse.
  * Dimanche ($7$) $\rightarrow 4$ secousses.

##### 2. États locaux (`useState`)
```typescript
var [count, setCount] = useState(0);
var [auth, setAuth] = useState(required === 0);
var [authMethod, setAuthMethod] = useState('');
```
* **`count`** : Nombre actuel de secousses effectuées par l'utilisateur. Initialisé à `0`.
* **`auth`** : Booléen indiquant si l'utilisateur est authentifié. Initialisé à `true` si le nombre de secousses requises pour le jour actuel est `0`.
* **`authMethod`** : Chaîne de caractères indiquant la méthode d'authentification réussie (`'secousse'` ou `'empreinte'`).

##### 3. Fonction `handleShake()` (Gestion d'une secousse)
```typescript
function handleShake() {
  Vibration.vibrate(60);
  setCount(function (prev) {
    var next = prev + 1;
    if (next >= required) {
      setAuthMethod('secousse');
      setAuth(true);
    }
    return next;
  });
}
```
* **`Vibration.vibrate(60)`** : Fait vibrer le téléphone pendant 60 millisecondes pour donner un retour physique (haptique) à l'utilisateur à chaque secousse validée.
* **`setCount(...)`** : Incrémente l'état du compteur de manière fonctionnelle (basée sur l'état précédent `prev` pour éviter les problèmes de concurrence). Si la nouvelle valeur atteint ou dépasse le nombre requis, l'utilisateur est authentifié (`setAuth(true)`) et la méthode est définie à `'secousse'`.

##### 4. Fonction `handleBiometric()` (Authentification Biométrique)
```typescript
function handleBiometric() {
  var rnBiometrics = new ReactNativeBiometrics();
  rnBiometrics.simplePrompt({ promptMessage: 'Confirmez votre empreinte' })
    .then(function (result) {
      if (result.success) {
        setAuthMethod('empreinte');
        setAuth(true);
      }
    })
    .catch(function () {
      console.log('Empreinte annulee');
    });
}
```
* **`ReactNativeBiometrics`** : Utilise l'API de biométrie native du téléphone (Fingerprint/FaceID).
* **`simplePrompt(...)`** : Affiche la boîte de dialogue système native d'authentification biométrique.
* **`.then(...)`** : Si l'utilisateur pose son doigt avec succès (`result.success`), l'application est déverrouillée instantanément via l'empreinte.

##### 5. Hook d'Effet `useEffect` (Écoute des événements natifs)
```typescript
useEffect(function () {
  if (auth) return;

  let sub;
  if (Platform.OS === 'android') {
    sub = DeviceEventEmitter.addListener('ShakeEvent', handleShake);
  } else {
    const { ShakeEventEmitter } = NativeModules;
    const shakeEmitter = new NativeEventEmitter(ShakeEventEmitter);
    sub = shakeEmitter.addListener('ShakeEvent', handleShake);
  }

  return function () {
    sub.remove();
  };
}, [auth]);
```
* **Rôle** : Ce hook s'exécute lorsque le composant est monté ou lorsque l'état `auth` change.
* **Logique Native multiplateforme** :
  * **Android** : Utilise le `DeviceEventEmitter` global pour écouter l'événement `'ShakeEvent'` émis par le code Kotlin.
  * **iOS** : Récupère le module natif exporté `ShakeEventEmitter` depuis `NativeModules`, instancie un `NativeEventEmitter` spécifique et s'y abonne.
* **Nettoyage (Clean-up)** : La fonction retournée `sub.remove()` supprime l'écouteur d'événements lorsque le composant est démonté ou si l'utilisateur s'authentifie, évitant ainsi des fuites de mémoire (memory leaks).

---

### 3.2. Le Niveau Natif Android (`MainActivity.kt` et `MainApplication.kt`)

#### A. `MainActivity.kt`
C'est le fichier Android dans lequel nous interceptons le capteur physique de l'accéléromètre pour calculer les forces de secousses et les transmettre à React Native.

##### 1. Interfaces implémentées
```kotlin
class MainActivity : ReactActivity(), SensorEventListener {
```
* **`ReactActivity()`** : Classe de base de React Native qui gère le chargement du moteur React.
* **`SensorEventListener`** : Interface Android indispensable pour écouter les modifications des capteurs de l'appareil. Exige l'implémentation de `onSensorChanged` et `onAccuracyChanged`.

##### 2. Déclaration des variables de capteur
```kotlin
private lateinit var sensorManager: SensorManager
private var accelerometer: Sensor? = null
private var lastShakeTime: Long = 0
private val SHAKE_THRESHOLD = 20.0f          // Seuil de force d'accélération
private val MIN_TIME_BETWEEN_SHAKES = 400   // Anti-rebond (debounce) en ms
```
* **`sensorManager`** : Service système Android qui gère l'ensemble des capteurs de l'appareil.
* **`accelerometer`** : Instance spécifique du capteur d'accéléromètre.
* **`lastShakeTime`** : Stocke le timestamp de la dernière secousse enregistrée pour éviter qu'un seul grand mouvement ne soit compté pour 10 secousses d'un coup (anti-rebond).

##### 3. Enregistrement des écouteurs (`onResume` / `onPause`)
```kotlin
override fun onResume() {
  super.onResume()
  accelerometer?.let {
    sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
  }
}

override fun onPause() {
  super.onPause()
  sensorManager.unregisterListener(this)
}
```
* **Rôle** : Enregistre l'écouteur d'accéléromètre uniquement quand l'application est active au premier plan (`onResume`) et le coupe immédiatement quand l'application passe en arrière-plan (`onPause`) pour économiser drastiquement la batterie du téléphone.

##### 4. Algorithme de détection de secousse (`onSensorChanged`)
```kotlin
override fun onSensorChanged(event: SensorEvent) {
  val x = event.values[0]  // Accélération sur l'axe X (gauche/droite)
  val y = event.values[1]  // Accélération sur l'axe Y (haut/bas)
  val z = event.values[2]  // Accélération sur l'axe Z (avant/arrière)
  val magnitude = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
  val gForce = magnitude / SensorManager.GRAVITY_EARTH // Normalisation en forces G

  val now = System.currentTimeMillis()
  if (gForce > (SHAKE_THRESHOLD / 9.81f) && now - lastShakeTime > MIN_TIME_BETWEEN_SHAKES) {
    lastShakeTime = now
    
    // Communication avec React Native
    reactInstanceManager.currentReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("ShakeEvent", null)
  }
}
```
* **Calcul de Magnitude** : Utilisation du théorème de Pythagore en 3D ($\sqrt{x^2 + y^2 + z^2}$) pour calculer l'accélération totale peu importe la direction dans laquelle le téléphone est secoué.
* **Calcul de Force G** : Division par la constante gravitationnelle de la Terre ($9.81 m/s^2$) pour obtenir la force en unité G.
* **Communication avec React Native (La passerelle)** :
  * Récupère le contexte React actuel via `reactInstanceManager.currentReactContext`.
  * Accède au module d'émission d'événements JavaScript `RCTDeviceEventEmitter`.
  * Appelle la méthode `emit` en diffusant l'événement `"ShakeEvent"`.

---

#### B. `MainApplication.kt`
Initialise l'application globale sur Android et configure le moteur d'exécution JavaScript.

##### Surcharge de `getJSMainModuleName`
```kotlin
override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      // ...
      override fun getJSMainModuleName(): String = "index"
```
* **Rôle** : Cette surcharge indique au chargeur d'application de chercher le fichier nommé `"index"` (donc `index.js` à la racine) comme point d'entrée principal pour packager et interpréter le code JavaScript.

---

### 3.3. Le Niveau Natif iOS (`AppDelegate.swift` et `ShakeEventEmitter.m`)

Sur iOS, l'approche est différente. Au lieu de lire manuellement les valeurs brutes de l'accéléromètre, iOS possède un détecteur de secousse intégré de très haut niveau.

#### A. `AppDelegate.swift` (L'interception globale du geste)
```swift
extension UIWindow {
  open override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
    if motion == .motionShake {
      NotificationCenter.default.post(name: NSNotification.Name("ShakeEvent"), object: nil)
    }
  }
}
```
* **`extension UIWindow`** : Étend la classe de fenêtre principale d'iOS. Toutes les secousses sur l'écran du téléphone passeront par cette fenêtre.
* **`motionEnded`** : Méthode système d'iOS déclenchée à la fin d'un mouvement physique.
* **`motion == .motionShake`** : Filtre spécifiquement les mouvements pour ne capturer que les secousses.
* **`NotificationCenter.default.post`** : Envoie une notification interne au système iOS nommée `"ShakeEvent"`.

---

#### B. `ShakeEventEmitter.m` (L'émetteur d'événements Objective-C)
C'est le module de pont natif iOS.

```objectivec
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface ShakeEventEmitter : RCTEventEmitter <RCTBridgeModule>
@end

@implementation ShakeEventEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"ShakeEvent"];
}

- (void)startObserving {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleShake:)
                                               name:@"ShakeEvent"
                                             object:nil];
}

- (void)stopObserving {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleShake:(NSNotification *)notification {
  [self sendEventWithName:@"ShakeEvent" body:nil];
}

@end
```
* **`RCTEventEmitter`** : Classe de base de React Native sur iOS pour envoyer des événements asynchrones vers le JavaScript.
* **`RCT_EXPORT_MODULE()`** : Macro de React Native qui enregistre automatiquement cette classe Objective-C en tant que module natif accessible dans le code JavaScript (`NativeModules.ShakeEventEmitter`).
* **`supportedEvents`** : Déclare la liste des chaînes d'événements que ce module a le droit d'envoyer au JavaScript (ici, uniquement `@"ShakeEvent"`).
* **`startObserving` / `stopObserving`** :
  * `startObserving` s'abonne à la notification iOS `"ShakeEvent"` émise par `AppDelegate.swift`.
  * `stopObserving` supprime cet abonnement pour éviter d'occuper de la mémoire inutilement.
* **`sendEventWithName`** : C'est la méthode de pont qui envoie l'événement au thread JavaScript de React Native.

---

### 3.4. Le Niveau CI/CD Automatisé (`build.yml`)

Ce fichier dans `.github/workflows/` permet de compiler l'application automatiquement à chaque sauvegarde (`git push`). C'est un excellent exemple d'Infrastructure en tant que Code (IaC) pour les étudiants.

```yaml
name: Build ShakeAuth

on:
  push:
    branches: [ main ]
  workflow_dispatch:
```
* **`on: push`** : Déclenche automatiquement le script dès que du code est poussé sur la branche `main`.
* **`workflow_dispatch`** : Permet de lancer la compilation manuellement depuis le site web de GitHub.

```yaml
  build-android:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
```
* **`runs-on: ubuntu-latest`** : Le build Android tourne sur un serveur Linux Ubuntu hébergé par GitHub.
* **`actions/checkout@v4`** : Récupère le code source de votre dépôt sur le serveur.

```yaml
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
```
* **Rôle** : Installe le Java Development Kit (JDK 17) nécessaire pour compiler les applications Android modernes avec Gradle.

```yaml
      - name: Cache Gradle
        uses: gradle/actions/setup-gradle@v4
```
* **Rôle** : Utilise un cache pour conserver les fichiers intermédiaires de Gradle. Cela évite de retélécharger toutes les dépendances Android à chaque build, réduisant le temps de compilation de 10 minutes à seulement 2 minutes !

```yaml
      - name: Build Android Release APK
        run: |
          cd android
          ./gradlew assembleRelease --no-daemon
```
* **`./gradlew assembleRelease`** : Lance le compilateur Gradle pour générer l'APK de production optimisé et signé avec la clé par défaut (`debug.keystore`).

```yaml
      - name: Upload Release APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release-apk
          path: android/app/build/outputs/apk/release/app-release.apk
```
* **Rôle** : Récupère le fichier APK produit et le met à disposition en téléchargement direct à la fin du workflow dans les "Artifacts".

---

## 4. Synthèse Pédagogique pour les Étudiants

Si vous étudiez ce projet pour apprendre le développement mobile de zéro, retenez ces **4 piliers fondamentaux** :

1. **L'Interface Utilisateur (UI)** se construit en JavaScript/TypeScript (dans `App.tsx`) avec des composants comme `View`, `Text`, et `StyleSheet`. Ce code est universel.
2. **Pour accéder au matériel physique (Capteurs)**, on doit descendre dans le code natif spécifique :
   * Sur Android : en écoutant l'accéléromètre matériel avec `SensorEventListener` et en calculant les forces de mouvement en mathématiques 3D.
   * Sur iOS : en écoutant les gestes de secousses natifs intégrés à UIKit dans la classe de fenêtre `UIWindow`.
3. **Le Pont (Bridge)** permet au Natif d'envoyer des événements asynchrones vers le JavaScript en utilisant des *Event Emitters* (`RCTDeviceEventEmitter` sous Android et `RCTEventEmitter` sous iOS).
4. **La compilation mobile** est complexe et lourde localement, mais elle peut être entièrement automatisée et simplifiée en utilisant des outils de CI/CD comme **GitHub Actions** pour générer des fichiers installables (`.apk`) à chaque modification.

package com.shakeauth

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.sqrt

class MainActivity : ReactActivity(), SensorEventListener {

  private lateinit var sensorManager: SensorManager
  private var accelerometer: Sensor? = null
  private var lastShakeTime: Long = 0
  private val SHAKE_THRESHOLD = 20.0f
  private val MIN_TIME_BETWEEN_SHAKES = 400

  override fun getMainComponentName(): String = "ShakeAuth"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
    accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
  }

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

  override fun onSensorChanged(event: SensorEvent) {
    val x = event.values[0]
    val y = event.values[1]
    val z = event.values[2]
    val magnitude = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
    val gForce = magnitude / SensorManager.GRAVITY_EARTH

    val now = System.currentTimeMillis()
    if (gForce > (SHAKE_THRESHOLD / 9.81f) && now - lastShakeTime > MIN_TIME_BETWEEN_SHAKES) {
      lastShakeTime = now

      try {
        reactInstanceManager.currentReactContext
          ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit("ShakeEvent", null)
      } catch (e: IllegalStateException) {
        // ReactInstanceManager not yet initialized
      }
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}

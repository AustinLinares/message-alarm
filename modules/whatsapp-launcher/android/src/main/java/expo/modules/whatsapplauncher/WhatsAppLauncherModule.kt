package expo.modules.whatsapplauncher

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Opens a wa.me link in one specific app (WhatsApp or WhatsApp Business).
// Linking.openURL can't do this: Android just uses whichever app is the
// default handler for wa.me links.
class WhatsAppLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WhatsAppLauncher")

    // Resolves to true when the app opened, false when it isn't installed.
    AsyncFunction("openInPackage") { packageName: String, url: String ->
      val context: Context? = appContext.currentActivity ?: appContext.reactContext
      if (context == null) {
        false
      } else {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
          setPackage(packageName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
          context.startActivity(intent)
          true
        } catch (e: ActivityNotFoundException) {
          false
        }
      }
    }
  }
}

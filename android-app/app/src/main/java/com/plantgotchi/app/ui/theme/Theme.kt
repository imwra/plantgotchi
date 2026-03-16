package com.plantgotchi.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.plantgotchi.app.R

// ---- Plantgotchi Color Palette ----

val Cream = Color(0xFFF0EAD6)
val TextBrown = Color(0xFF3D3425)
val Green = Color(0xFF4A9E3F)
val Blue = Color(0xFF5BA3D9)
val Yellow = Color(0xFFE8B835)
val Red = Color(0xFFD95B5B)
val Purple = Color(0xFF9B6BB5)

val CreamDark = Color(0xFF2A2520)
val TextCreamLight = Color(0xFFF0EAD6)

// ---- Color Schemes ----

private val LightColorScheme = lightColorScheme(
    primary = Green,
    onPrimary = Color.White,
    primaryContainer = Green.copy(alpha = 0.15f),
    onPrimaryContainer = TextBrown,
    secondary = Blue,
    onSecondary = Color.White,
    secondaryContainer = Blue.copy(alpha = 0.15f),
    onSecondaryContainer = TextBrown,
    tertiary = Purple,
    onTertiary = Color.White,
    tertiaryContainer = Purple.copy(alpha = 0.15f),
    onTertiaryContainer = TextBrown,
    error = Red,
    onError = Color.White,
    errorContainer = Red.copy(alpha = 0.15f),
    onErrorContainer = TextBrown,
    background = Cream,
    onBackground = TextBrown,
    surface = Cream,
    onSurface = TextBrown,
    surfaceVariant = Color(0xFFE8E2D0),
    onSurfaceVariant = TextBrown.copy(alpha = 0.7f),
    outline = TextBrown.copy(alpha = 0.3f),
)

private val DarkColorScheme = darkColorScheme(
    primary = Green,
    onPrimary = Color.White,
    primaryContainer = Green.copy(alpha = 0.25f),
    onPrimaryContainer = TextCreamLight,
    secondary = Blue,
    onSecondary = Color.White,
    secondaryContainer = Blue.copy(alpha = 0.25f),
    onSecondaryContainer = TextCreamLight,
    tertiary = Purple,
    onTertiary = Color.White,
    tertiaryContainer = Purple.copy(alpha = 0.25f),
    onTertiaryContainer = TextCreamLight,
    error = Red,
    onError = Color.White,
    errorContainer = Red.copy(alpha = 0.25f),
    onErrorContainer = TextCreamLight,
    background = CreamDark,
    onBackground = TextCreamLight,
    surface = CreamDark,
    onSurface = TextCreamLight,
    surfaceVariant = Color(0xFF3A3530),
    onSurfaceVariant = TextCreamLight.copy(alpha = 0.7f),
    outline = TextCreamLight.copy(alpha = 0.3f),
)

// ---- Typography ----

/**
 * Press Start 2P pixel font — download the TTF into res/font/press_start_2p.ttf.
 * Falls back to default monospace if the font file is missing.
 */
val PixelFontFamily = try {
    FontFamily(Font(R.font.press_start_2p, FontWeight.Normal))
} catch (_: Exception) {
    FontFamily.Monospace
}

val PlantgotchiTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 28.sp,
        lineHeight = 36.sp,
    ),
    displayMedium = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 24.sp,
        lineHeight = 32.sp,
    ),
    displaySmall = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 20.sp,
        lineHeight = 28.sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 18.sp,
        lineHeight = 26.sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 22.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 22.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 20.sp,
    ),
    titleSmall = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 10.sp,
        lineHeight = 18.sp,
    ),
    bodyLarge = TextStyle(
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    bodySmall = TextStyle(
        fontSize = 12.sp,
        lineHeight = 16.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 10.sp,
        lineHeight = 16.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 9.sp,
        lineHeight = 14.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = PixelFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 8.sp,
        lineHeight = 12.sp,
    ),
)

// ---- Theme composable ----

@Composable
fun PlantgotchiTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = PlantgotchiTypography,
        content = content,
    )
}

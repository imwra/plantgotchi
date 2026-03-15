package com.plantgotchi.app.ui.garden

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.agent.RuleEngine
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.SensorReading
import com.plantgotchi.app.ui.theme.Blue
import com.plantgotchi.app.ui.theme.Green
import com.plantgotchi.app.ui.theme.Red
import com.plantgotchi.app.ui.theme.Yellow

/**
 * Pixel-art styled plant card for the garden grid.
 *
 * Shows emoji, name, moisture bar, HP bar, and status indicator.
 */
@Composable
fun PlantCard(
    plant: Plant,
    latestReading: SensorReading?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val moisture = latestReading?.moisture
    val temp = latestReading?.temperature
    val hp = RuleEngine.computeHP(
        moisture = moisture,
        temp = temp,
        moistureMin = plant.moistureMin,
        moistureMax = plant.moistureMax,
        tempMin = plant.tempMin,
        tempMax = plant.tempMax,
    )
    val status = RuleEngine.computeStatus(
        moisture = moisture,
        temp = temp,
        moistureMin = plant.moistureMin,
        moistureMax = plant.moistureMax,
        tempMin = plant.tempMin,
        tempMax = plant.tempMax,
    )

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Emoji
            Text(
                text = plant.emoji,
                fontSize = 40.sp,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Name
            Text(
                text = plant.name,
                style = MaterialTheme.typography.titleSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Status indicator
            val statusText = when (status) {
                "happy" -> "\u2665 Happy"
                "thirsty" -> "\u2639 Thirsty"
                else -> "? Unknown"
            }
            val statusColor = when (status) {
                "happy" -> Green
                "thirsty" -> Yellow
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }

            Text(
                text = statusText,
                style = MaterialTheme.typography.labelSmall,
                color = statusColor,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // HP bar
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = "HP",
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.width(24.dp),
                )
                LinearProgressIndicator(
                    progress = { hp / 100f },
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = when {
                        hp >= 70 -> Green
                        hp >= 40 -> Yellow
                        else -> Red
                    },
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "$hp",
                    style = MaterialTheme.typography.labelSmall,
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Moisture bar
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = "\uD83D\uDCA7", // 💧
                    fontSize = 10.sp,
                    modifier = Modifier.width(24.dp),
                )
                val moistureFraction = (moisture ?: 0) / 100f
                LinearProgressIndicator(
                    progress = { moistureFraction },
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = Blue,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (moisture != null) "$moisture%" else "--",
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}

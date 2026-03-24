package com.plantgotchi.app.ui.courses

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.plantgotchi.app.R

@Composable
fun QuizBlockView(
    question: String,
    options: List<String>,
    correctIndex: Int,
    explanation: String,
    onAnswer: (Int) -> Unit,
    disabled: Boolean = false,
) {
    var selected by remember { mutableIntStateOf(-1) }
    var submitted by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(question, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))

            options.forEachIndexed { i, option ->
                val borderColor = when {
                    submitted && i == correctIndex -> MaterialTheme.colorScheme.primary
                    submitted && i == selected && i != correctIndex -> MaterialTheme.colorScheme.error
                    selected == i -> MaterialTheme.colorScheme.outline
                    else -> MaterialTheme.colorScheme.outlineVariant
                }
                val containerColor = when {
                    submitted && i == correctIndex -> MaterialTheme.colorScheme.primaryContainer
                    submitted && i == selected && i != correctIndex -> MaterialTheme.colorScheme.errorContainer
                    else -> MaterialTheme.colorScheme.surface
                }

                OutlinedButton(
                    onClick = { if (!submitted && !disabled) selected = i },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, borderColor),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = containerColor),
                    enabled = !submitted && !disabled,
                ) {
                    Text(option, modifier = Modifier.fillMaxWidth(), style = MaterialTheme.typography.bodyMedium)
                }
            }

            if (!submitted && !disabled) {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        submitted = true
                        onAnswer(selected)
                    },
                    enabled = selected >= 0,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(stringResource(R.string.courses_quiz_submit))
                }
            }

            if (submitted) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (selected == correctIndex) stringResource(R.string.courses_quiz_correct)
                           else stringResource(R.string.courses_quiz_incorrect),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected == correctIndex) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.error,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(explanation, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

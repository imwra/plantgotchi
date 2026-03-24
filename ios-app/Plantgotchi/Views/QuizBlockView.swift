#if os(iOS)
import SwiftUI

struct QuizBlockView: View {
    let content: String // JSON string
    let onSubmit: (String) -> Void // quiz_answers JSON

    @State private var selected: Int? = nil
    @State private var submitted = false

    private var quiz: QuizData? {
        guard let data = content.data(using: .utf8),
              let q = try? JSONDecoder().decode(QuizData.self, from: data) else { return nil }
        return q
    }

    var body: some View {
        if let q = quiz {
            VStack(alignment: .leading, spacing: 12) {
                Text(q.question)
                    .font(PlantgotchiTheme.bodyFont.weight(.semibold))
                    .foregroundColor(PlantgotchiTheme.text)

                ForEach(Array(q.options.enumerated()), id: \.offset) { idx, option in
                    Button {
                        if !submitted { selected = idx }
                    } label: {
                        HStack {
                            Image(systemName: selected == idx ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(optionColor(index: idx, correctIndex: q.correctIndex))
                            Text(option)
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(selected == idx ? PlantgotchiTheme.green.opacity(0.08) : PlantgotchiTheme.text.opacity(0.03))
                        .cornerRadius(8)
                    }
                }

                if submitted {
                    Text(selected == q.correctIndex ? S.correct : S.incorrect)
                        .font(PlantgotchiTheme.bodyFont.weight(.semibold))
                        .foregroundColor(selected == q.correctIndex ? PlantgotchiTheme.green : PlantgotchiTheme.red)
                    if let explanation = q.explanation {
                        Text(explanation)
                            .font(PlantgotchiTheme.captionFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.7))
                    }
                } else {
                    Button {
                        submitted = true
                        let answers = "{\"selected\": \(selected ?? -1)}"
                        onSubmit(answers)
                    } label: {
                        Text(S.submitQuiz)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(selected != nil ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.3))
                            .cornerRadius(8)
                    }
                    .disabled(selected == nil)
                }
            }
        }
    }

    private func optionColor(index: Int, correctIndex: Int) -> Color {
        if submitted {
            if index == correctIndex { return PlantgotchiTheme.green }
            if selected == index { return PlantgotchiTheme.red }
            return PlantgotchiTheme.text.opacity(0.3)
        }
        return selected == index ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.3)
    }
}

struct QuizData: Codable {
    let question: String
    let options: [String]
    let correctIndex: Int
    let explanation: String?

    enum CodingKeys: String, CodingKey {
        case question, options
        case correctIndex = "correct_index"
        case explanation
    }
}
#endif

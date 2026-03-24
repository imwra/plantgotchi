#if os(iOS)
import SwiftUI

struct CourseCatalogView: View {
    @State private var courses: [Course] = []
    @State private var searchText = ""
    @State private var isLoading = true
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
                    TextField(S.searchCourses, text: $searchText)
                        .font(PlantgotchiTheme.bodyFont)
                }
                .padding(10)
                .background(PlantgotchiTheme.text.opacity(0.05))
                .cornerRadius(10)

                if isLoading {
                    ProgressView().padding(.top, 40)
                } else if courses.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "book.closed")
                            .font(.system(size: 48))
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                        Text(S.noCourses)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                    }
                    .padding(.top, 40)
                } else {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(courses) { course in
                            NavigationLink(destination: CourseDetailView(slug: course.slug)) {
                                CourseCardView(course: course)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding()
        }
        .background(PlantgotchiTheme.background.ignoresSafeArea())
        .navigationTitle(S.courses)
        .task { await loadCourses() }
        .onChange(of: searchText) { _ in
            searchTask?.cancel()
            searchTask = Task {
                try? await Task.sleep(nanoseconds: 300_000_000)
                guard !Task.isCancelled else { return }
                await loadCourses()
            }
        }
        .onAppear {
            Analytics.track("screen_viewed", properties: ["screen_name": "course_catalog"])
        }
    }

    @MainActor
    private func loadCourses() async {
        isLoading = courses.isEmpty
        do {
            courses = try await TursoSync.shared.fetchCourses(
                query: searchText.isEmpty ? nil : searchText
            )
        } catch {
            print("[CourseCatalogView] Failed: \(error)")
        }
        isLoading = false
    }
}

// MARK: - Course Card

struct CourseCardView: View {
    let course: Course

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Cover image
            if let url = course.coverImageUrl, let imageUrl = URL(string: url) {
                AsyncImage(url: imageUrl) { image in
                    image.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle().fill(PlantgotchiTheme.green.opacity(0.1))
                }
                .frame(height: 100)
                .clipped()
                .cornerRadius(8)
            } else {
                Rectangle()
                    .fill(PlantgotchiTheme.green.opacity(0.1))
                    .frame(height: 100)
                    .cornerRadius(8)
                    .overlay(
                        Image(systemName: "book.fill")
                            .font(.title)
                            .foregroundColor(PlantgotchiTheme.green.opacity(0.3))
                    )
            }

            Text(course.title)
                .font(PlantgotchiTheme.pixelFont(size: 10))
                .foregroundColor(PlantgotchiTheme.text)
                .lineLimit(2)

            if let creator = course.creatorName {
                Text("\(S.byCreator) \(creator)")
                    .font(.caption2)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
            }

            // Price badge
            Text(course.priceCents == 0 ? S.free : formatPrice(course.priceCents, course.currency))
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundColor(course.priceCents == 0 ? PlantgotchiTheme.green : PlantgotchiTheme.yellow)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    (course.priceCents == 0 ? PlantgotchiTheme.green : PlantgotchiTheme.yellow)
                        .opacity(0.12)
                )
                .cornerRadius(10)
        }
        .plantgotchiCard()
    }

    private func formatPrice(_ cents: Int, _ currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: Double(cents) / 100.0)) ?? "$\(cents / 100)"
    }
}
#endif

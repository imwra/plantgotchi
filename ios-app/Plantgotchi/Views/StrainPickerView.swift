#if os(iOS)
import SwiftUI

/// Searchable list of strain profiles. Allows picking a built-in strain or
/// creating a custom one that is persisted to the local database.
struct StrainPickerView: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var selectedStrain: StrainProfile?
    @Binding var customStrainName: String
    @Binding var strainType: StrainType

    @State private var searchText = ""
    @State private var strains: [StrainProfile] = []
    @State private var showCustomSheet = false
    @State private var customName = ""
    @State private var customType: StrainType = .hybrid

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.cream
                    .ignoresSafeArea()

                List {
                    if filteredStrains.isEmpty {
                        Text(S.noStrainsFound)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                            .listRowBackground(Color.clear)
                    } else {
                        ForEach(filteredStrains) { strain in
                            Button {
                                selectedStrain = strain
                                customStrainName = strain.name
                                if let t = strain.type {
                                    strainType = t
                                }
                                dismiss()
                            } label: {
                                strainRow(strain)
                            }
                            .listRowBackground(
                                selectedStrain?.id == strain.id
                                    ? PlantgotchiTheme.green.opacity(0.15)
                                    : Color.white.opacity(0.6)
                            )
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .searchable(text: $searchText, prompt: S.searchStrains)
            }
            .navigationTitle(S.selectStrain)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(S.cancel) { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCustomSheet = true
                    } label: {
                        Label(S.customStrain, systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCustomSheet) {
                customStrainSheet
            }
            .onAppear(perform: loadStrains)
            .onChange(of: searchText) { _, newValue in
                searchStrains(query: newValue)
            }
        }
    }

    // MARK: - Strain Row

    private func strainRow(_ strain: StrainProfile) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(strain.name)
                    .font(PlantgotchiTheme.bodyFont)
                    .foregroundColor(PlantgotchiTheme.text)

                HStack(spacing: 8) {
                    if let type = strain.type {
                        Text(typeLabel(type))
                            .font(PlantgotchiTheme.captionFont)
                            .foregroundColor(PlantgotchiTheme.green)
                    }
                    if let diff = strain.difficulty {
                        Text(diff.capitalized)
                            .font(PlantgotchiTheme.captionFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                    }
                    if strain.isCustom {
                        Text(S.customStrain)
                            .font(PlantgotchiTheme.captionFont)
                            .foregroundColor(PlantgotchiTheme.purple)
                    }
                }
            }

            Spacer()

            if selectedStrain?.id == strain.id {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(PlantgotchiTheme.green)
            }
        }
        .contentShape(Rectangle())
    }

    // MARK: - Custom Strain Sheet

    private var customStrainSheet: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.cream
                    .ignoresSafeArea()

                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(S.strainName)
                            .font(PlantgotchiTheme.pixelFont(size: 9))
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

                        TextField(S.strainName, text: $customName)
                            .textFieldStyle(.roundedBorder)
                            .font(PlantgotchiTheme.bodyFont)
                    }
                    .plantgotchiCard()

                    VStack(alignment: .leading, spacing: 12) {
                        Text(S.type)
                            .font(PlantgotchiTheme.pixelFont(size: 9))
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

                        Picker(S.type, selection: $customType) {
                            Text(S.indica).tag(StrainType.indica)
                            Text(S.sativa).tag(StrainType.sativa)
                            Text(S.hybrid).tag(StrainType.hybrid)
                        }
                        .pickerStyle(.segmented)
                    }
                    .plantgotchiCard()

                    Spacer()
                }
                .padding()
            }
            .navigationTitle(S.addCustomStrain)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(S.cancel) { showCustomSheet = false }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(S.add) {
                        saveCustomStrain()
                    }
                    .font(.body.weight(.semibold))
                    .disabled(customName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    // MARK: - Helpers

    private var filteredStrains: [StrainProfile] {
        strains
    }

    private func typeLabel(_ type: StrainType) -> String {
        switch type {
        case .indica: return S.indica
        case .sativa: return S.sativa
        case .hybrid: return S.hybrid
        }
    }

    private func loadStrains() {
        do {
            strains = try AppDatabase.shared.getBuiltInStrains()
            // Also include custom strains in the initial load
            let custom = try AppDatabase.shared.searchStrainProfiles(query: "")
            let customOnly = custom.filter { $0.isCustom }
            let builtInIds = Set(strains.map(\.id))
            for c in customOnly where !builtInIds.contains(c.id) {
                strains.append(c)
            }
            strains.sort { $0.name < $1.name }
        } catch {
            strains = []
        }
    }

    private func searchStrains(query: String) {
        if query.isEmpty {
            loadStrains()
            return
        }
        do {
            strains = try AppDatabase.shared.searchStrainProfiles(query: query)
        } catch {
            strains = []
        }
    }

    private func saveCustomStrain() {
        let trimmed = customName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        let profile = StrainProfile(
            name: trimmed,
            type: customType,
            isCustom: true
        )

        do {
            try AppDatabase.shared.saveStrainProfile(profile)
            selectedStrain = profile
            customStrainName = profile.name
            strainType = customType
            showCustomSheet = false
            dismiss()
        } catch {
            // Silently fail — the user can retry
        }
    }
}

#Preview {
    StrainPickerView(
        selectedStrain: .constant(nil),
        customStrainName: .constant(""),
        strainType: .constant(.hybrid)
    )
}
#endif

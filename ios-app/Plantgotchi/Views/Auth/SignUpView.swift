#if os(iOS)
import SwiftUI
import AuthenticationServices

struct SignUpView: View {
    @EnvironmentObject private var authService: AuthService
    @EnvironmentObject private var themeManager: ThemeManager

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var currentNonce: String?

    var body: some View {
        ZStack {
            PlantgotchiTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    Text("\u{1F331}")
                        .font(.system(size: 48))
                        .padding(.top, 40)
                    Text("Create Account")
                        .font(PlantgotchiTheme.pixelFont(size: 20))
                        .foregroundColor(PlantgotchiTheme.text)

                    // Name field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Name")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                        TextField("Your name", text: $name)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.name)
                    }
                    .padding(.horizontal, 24)

                    // Email field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                        TextField("you@example.com", text: $email)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                    }
                    .padding(.horizontal, 24)

                    // Password field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Password")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                        SecureField("At least 8 characters", text: $password)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.newPassword)
                    }
                    .padding(.horizontal, 24)

                    if let errorMessage {
                        Text(errorMessage)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(.red)
                            .padding(.horizontal, 24)
                    }

                    Button(action: signUp) {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Create Account")
                                .font(PlantgotchiTheme.pixelFont(size: 14))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(PlantgotchiTheme.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .padding(.horizontal, 24)
                    .disabled(isLoading)

                    // Divider
                    HStack {
                        Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                        Text("or")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                        Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                    }
                    .padding(.horizontal, 24)

                    SignInWithAppleButton(.signUp) { request in
                        let nonce = AppleSignInHelper.randomNonceString()
                        currentNonce = nonce
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = AppleSignInHelper.sha256(nonce)
                    } onCompletion: { result in
                        handleAppleSignIn(result)
                    }
                    .signInWithAppleButtonStyle(
                        themeManager.isDarkMode ? .white : .black
                    )
                    .frame(height: 48)
                    .cornerRadius(12)
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
        }
    }

    private func signUp() {
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        guard password.count >= 8 else {
            errorMessage = "Password must be at least 8 characters"
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                try await authService.signUp(email: email, password: password, name: name)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let creds = AppleSignInHelper.extractCredentials(
                from: auth, nonce: currentNonce
            ) else {
                errorMessage = "Failed to get Apple credentials"
                return
            }
            isLoading = true
            errorMessage = nil
            Task {
                do {
                    try await authService.signInWithApple(
                        idToken: creds.idToken, nonce: creds.nonce
                    )
                } catch {
                    errorMessage = error.localizedDescription
                }
                isLoading = false
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
}
#endif

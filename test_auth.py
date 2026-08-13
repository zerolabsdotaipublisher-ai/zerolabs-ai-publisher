import re

with open("components/auth/sign-up-form.tsx", "r") as f:
    content = f.read()

checkbox_block = """      <label htmlFor={`${id}-terms`} className="auth-terms-checkbox">
        <input
          id={`${id}-terms`}
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          required
          aria-required="true"
        />
        I agree to the Terms of Service and Privacy Policy.
      </label>"""

if checkbox_block in content:
    print("Found checkbox block exactly as expected.")

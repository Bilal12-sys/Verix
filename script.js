  // Import from Firebase.js
  import {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  doc,
  setDoc,
  onAuthStateChanged,
  signOut
} from "./config/firebase.js";




  // Select Form and tabs
  const login = document.getElementById("loginForm");
  const signup = document.getElementById("signupForm");
  const tabs = document.querySelectorAll(".tab");

  // Login Sekect
  const Show_Login = document.getElementById("showL");
  const Login_email = document.getElementById("L_email");
  const Login_pas = document.getElementById("L_pas");
  const Login_btn = document.getElementById("L_btn");

  // Sign Select
  const Show_Sign = document.getElementById("showS");
  const Sign_name = document.getElementById("S_name");
  const Sign_email = document.getElementById("S_email");
  const Sign_pas = document.getElementById("S_pas");
  const Sign_btn = document.getElementById("S_btn");

  // Direction
  const DirectL = document.getElementById("rl");
  const DirectS = document.getElementById("rs");

  const googleBtn = document.getElementById("googleBtn");

  googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        provider: "google"
      },
      { merge: true }
    );

    const pop = box("Google Login Successful", "success");
    closeBox(pop, 1200);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);

  } catch (error) {
    const pop = box(error.message, "error");
    closeBox(pop, 2000);
    console.error(error);
  }
});

  // Form Displays
  login.style.display = "flex";
  signup.style.display = "none";

  // Email format checker
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Save original button text so we can restore it after loading
  Login_btn.dataset.label = Login_btn.textContent;
  Sign_btn.dataset.label = Sign_btn.textContent;


  // Password DOM Select
  const eye_btn = document.getElementById("eyebtn");
  const eye_btn2 = document.getElementById("eyebtn2");

  // Icons
  const eyeOpen = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
  </svg>`;

  const eyeClosed = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`;

  // Default icon
  if (eye_btn) eye_btn.innerHTML = eyeClosed;
  if (eye_btn2) eye_btn2.innerHTML = eyeClosed;

  // Show / Hide Function
  function show_hide(input, button) {
      if (input.type === "password") {
          input.type = "text";
          button.innerHTML = eyeOpen;
      } else {
          input.type = "password";
          button.innerHTML = eyeClosed;
      }
  }

  // Login Password
  if (eye_btn && Login_pas) {
      eye_btn.addEventListener("click", () => {
          show_hide(Login_pas, eye_btn);
      });
  }

  // Signup Password
  if (eye_btn2 && Sign_pas) {
      eye_btn2.addEventListener("click", () => {
          show_hide(Sign_pas, eye_btn2);
      });
  }

  // Turn a button into a loading spinner state
  function setLoading(btn, isLoading) {
    if (isLoading) {
      btn.disabled = true;
      btn.classList.add("btn-loading");
      btn.innerHTML = `<span class="spinner"></span>`;
    } else {
      btn.disabled = false;
      btn.classList.remove("btn-loading");
      btn.textContent = btn.dataset.label;
    }
  }

  // Show inline red error text under a specific input
  function fieldError(input, message) {
    clearFieldError(input);

    if (!message) return;

    input.classList.add("input-error");

    const err = document.createElement("span");
    err.classList.add("error-text");
    err.textContent = message;

    input.closest(".inputs").insertAdjacentElement("afterend", err);
  }

  // Remove any existing error text under a specific input
  function clearFieldError(input) {
    input.classList.remove("input-error");

    const wrap = input.closest(".inputs");
    const next = wrap.nextElementSibling;

    if (next && next.classList.contains("error-text")) {
      next.remove();
    }
  }

  // Clear every error message inside a form
  function clearFormErrors(form) {
    form.querySelectorAll(".error-text").forEach(el => el.remove());
    form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
  }

  // Pop-up box Function
  function box(text, type = "info") {
    const box_parent = document.createElement("div");
    const popup = document.createElement("div");
    const inside_text = document.createElement("h3");

    box_parent.classList.add("box_p");
    popup.classList.add("pop_box", `pop_${type}`);
    inside_text.classList.add("box_text");

    inside_text.textContent = text;

    popup.appendChild(inside_text);
    box_parent.appendChild(popup);
    document.body.appendChild(box_parent);

    return box_parent;
  }

  // Fade a popup box out, then remove it
  function closeBox(pop, delay = 1500) {
    setTimeout(() => {
      pop.classList.add("pop_out");
      setTimeout(() => pop.remove(), 300);
    }, delay);
  }

  // Show Login Function
  function ShowLogin() {
    login.style.display = "flex";
    signup.style.display = "none";
    tabs[0].classList.add("active");
    tabs[1].classList.remove("active");
    clearFormErrors(login);
  }

  // Show Sign-in Function
  function ShowSign() {
    signup.style.display = "flex";
    login.style.display = "none";
    tabs[1].classList.add("active");
    tabs[0].classList.remove("active");
    clearFormErrors(signup);
  }

  // Actions Btns
  Show_Login.addEventListener("click", ShowLogin); // Show Login btn
  DirectL.addEventListener("click", ShowLogin); // Direct to login
  Show_Sign.addEventListener("click", ShowSign); // Show Sign btn
  DirectS.addEventListener("click", ShowSign); // Direct to Sign

  // Sign Up Setup
  Sign_btn.addEventListener("click", async (e) => {
    e.preventDefault();

    clearFormErrors(signup);

    const Sname = Sign_name.value.trim();
    const Semail = Sign_email.value.trim();
    const Spas = Sign_pas.value;

    let hasError = false;

    if (!Sname) {
      fieldError(Sign_name, "Please enter your name.");
      hasError = true;
    }

    if (!Semail) {
      fieldError(Sign_email, "Please enter your email.");
      hasError = true;
    } else if (!EMAIL_RE.test(Semail)) {
      fieldError(Sign_email, "Please enter a valid email address.");
      hasError = true;
    }

    if (!Spas) {
      fieldError(Sign_pas, "Please enter a password.");
      hasError = true;
    } else if (Spas.length < 6) {
      fieldError(Sign_pas, "Password must be at least 6 characters.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(Sign_btn, true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        Semail,
        Spas
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: Sname,
        email: Semail,
        uid: user.uid,
      });

      const pop = box("Account created successfully.", "success");
      closeBox(pop, 1200);

      Login_email.value = Semail;
      Login_pas.value = Spas;

      Sign_name.value = "";
      Sign_email.value = "";
      Sign_pas.value = "";

      ShowLogin();
    } catch (error) {

      if (error.code === "auth/email-already-in-use") {
        fieldError(Sign_email, "This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        fieldError(Sign_email, "Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        fieldError(Sign_pas, "Password is too weak.");
      } else {
        const pop = box(error.message, "error");
        closeBox(pop, 1800);
      }
    } finally {
      setLoading(Sign_btn, false);
    }
  });

  // Login Setup
  Login_btn.addEventListener("click", async (e) => {
    e.preventDefault();

    clearFormErrors(login);

    const Lemail = Login_email.value.trim();
    const lpas = Login_pas.value;

    let hasError = false;

    if (!Lemail) {
      fieldError(Login_email, "Please enter your email.");
      hasError = true;
    } else if (!EMAIL_RE.test(Lemail)) {
      fieldError(Login_email, "Please enter a valid email address.");
      hasError = true;
    }

    if (!lpas) {
      fieldError(Login_pas, "Please enter your password.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(Login_btn, true);

    try {
      await signInWithEmailAndPassword(auth, Lemail, lpas);

      const pop = box("Login successful.", "success");
      closeBox(pop, 1000);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {

      if (error.code === "auth/user-not-found") {
        fieldError(Login_email, "No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        fieldError(Login_pas, "Incorrect password.");
      } else if (error.code === "auth/invalid-credential") {
        fieldError(Login_pas, "Email or password is incorrect.");
      } else if (error.code === "auth/invalid-email") {
        fieldError(Login_email, "Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        const pop = box("Too many attempts. Try again later.", "error");
        closeBox(pop, 1800);
      } else {
        const pop = box(error.message, "error");
        closeBox(pop, 1800);
      }
    } finally {
      setLoading(Login_btn, false);
    }
  });

  // Mousee Hover Animation
  document.addEventListener('mousemove', e => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
  });

  // Auto Login Function
  onAuthStateChanged(auth, (user) => {
      if (user) {
          
          window.location.href = "dashboard.html";  
      } else {
          console.log("No user signed in");
      }
  });
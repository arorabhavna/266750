(function () {
  const PAGE_FILES = {
    profile: "mtg-profile.html",
    groups: "groups.html",
    upcoming: "upcoming.html",
    trips: "trips.html"
  };

  const STORAGE_KEYS = {
    theme: "mtgTheme",
    state: "mtgPlannerState",
    auth: "mtgSignedIn",
    genie: "mtgGenieChat"
  };

  const discoverableCommunityById = {
    GSF103: {
      name: "The Jackets",
      members: ["aruna", "bhavna", "jonah", "durga", "angel", "george"]
    },
    GT202: {
      name: "Metro Weekend Crew",
      members: ["Iris Vale", "Noah Pike", "Kira West", "Owen Frost"]
    }
  };
  const TRIP_STAGES = ["Idea", "Planning", "Confirmed", "Booked", "In Progress", "Completed"];
  const EXPERIENCE_TYPES = ["City", "Nature", "Historical", "Unique", "Adventure", "Food"];
  const DEFAULT_AI_MODEL = "Azure OpenAI GPT-4.1";
  const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  const DEFAULT_GROUP_POLLS = [
    { question: "Destination shortlist vote", options: ["Mysore", "Coorg", "Hampi"] },
    { question: "Hotel area preference", options: ["City center", "Scenic outskirts", "Near station"] }
  ];
  const DEFAULT_TRIP_POLLS = [
    { question: "Activity priority", options: ["Nature", "Food", "History"] },
    { question: "Start day timing", options: ["Early morning", "Late morning", "Afternoon"] }
  ];
  const DAY_ACTIVITY_OPTIONS = ["Hiking", "Museum", "Chill at Beach", "Cafe hopping", "Local Food Trail", "Sunset Viewpoint", "Market Walk", "Live Music"];
  const MEMBER_PROFILE_TEMPLATES = {
    aruna: { style: "Culture Explorer", pace: "Moderate", mustDo: ["Museum", "Sunset Viewpoint"] },
    bhavna: { style: "Planner + Foodie", pace: "Moderate", mustDo: ["Local Food Trail", "Cafe hopping"] },
    jonah: { style: "Outdoor Adventurer", pace: "Fast", mustDo: ["Hiking", "Market Walk"] },
    durga: { style: "Relaxed Discoverer", pace: "Relaxed", mustDo: ["Chill at Beach", "Cafe hopping"] },
    angel: { style: "Photo Spot Hunter", pace: "Moderate", mustDo: ["Sunset Viewpoint", "Museum"] },
    george: { style: "Logistics Lead", pace: "Moderate", mustDo: ["Local Food Trail", "Live Music"] }
  };
  const DEFAULT_GENIE_DESTINATIONS = [
    { name: "Jaipur", category: "history", highlights: ["Amber Fort", "City Palace"], weatherRangeF: "54 to 82" },
    { name: "Goa", category: "beach", highlights: ["Candolim Beach", "Aguada Fort"], weatherRangeF: "72 to 89" },
    { name: "Manali", category: "mountain", highlights: ["Solang Valley", "Atal Tunnel"], weatherRangeF: "34 to 68" },
    { name: "Bengaluru", category: "city", highlights: ["Cubbon Park", "Indiranagar food trail"], weatherRangeF: "61 to 86" },
    { name: "Munnar", category: "nature", highlights: ["Tea gardens", "Eravikulam Park"], weatherRangeF: "52 to 74" }
  ];
  let selectedCommunityId = null;
  let selectedTripId = null;

  function byId(id) { return document.getElementById(id); }
  function parseJson(value) {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  function toIsoDate(date) {
    const d = new Date(date.getTime());
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  function plusDays(days) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return toIsoDate(d);
  }
  function toTripId(seed, fallbackIndex) {
    const text = String(seed || `trip-${fallbackIndex + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `${text || "trip"}-${fallbackIndex + 1}`;
  }

  function normalizePace(value) {
    const text = String(value || "").toLowerCase();
    if (text === "relaxed" || text === "slow") return "Relaxed";
    if (text === "moderate" || text === "balanced" || text === "steady") return "Moderate";
    if (text === "fast-paced" || text === "packed" || text === "fast") return "Fast";
    return "Moderate";
  }

  function defaultState() {
    return {
      availabilityMode: "free",
      markedDays: { "3": "busy", "4": "busy", "10": "busy", "18": "busy", "6": "free", "7": "free", "14": "free", "22": "free" },
      preferences: {
        budget: "Moderate",
        experiences: ["City", "Nature"],
        pace: "Moderate",
        stay: "Hotel"
      },
      contact: {
        email: "george@example.com",
        phone: "+91 90000 00000",
        emergencyName: "durga",
        emergencyPhone: "+91 98888 88888"
      },
      communities: [
        {
          id: "GSF103",
          name: "The Jackets",
          members: ["aruna", "bhavna", "jonah", "durga", "angel", "george"],
          memberProfiles: [
            { name: "aruna", style: "Culture Explorer", pace: "Moderate", mustDo: ["Museum", "Sunset Viewpoint"] },
            { name: "bhavna", style: "Planner + Foodie", pace: "Moderate", mustDo: ["Local Food Trail", "Cafe hopping"] },
            { name: "jonah", style: "Outdoor Adventurer", pace: "Fast", mustDo: ["Hiking", "Market Walk"] },
            { name: "durga", style: "Relaxed Discoverer", pace: "Relaxed", mustDo: ["Chill at Beach", "Cafe hopping"] },
            { name: "angel", style: "Photo Spot Hunter", pace: "Moderate", mustDo: ["Sunset Viewpoint", "Museum"] },
            { name: "george", style: "Logistics Lead", pace: "Moderate", mustDo: ["Local Food Trail", "Live Music"] }
          ],
          polls: [
            { question: "Next destination choice", options: ["Mysore", "Coorg", "Pondicherry"] },
            { question: "Hotel area preference", options: ["City center", "Scenic outskirts"] }
          ]
        }
      ],
      trips: [
        {
          id: "kodai-escape-1",
          name: "Kodai Escape",
          destination: "Kodaikanal",
          startDate: plusDays(14),
          endDate: plusDays(17),
          communityId: "GSF103",
          stage: "Planning",
          activities: ["Lake cycling", "Coaker's Walk", "Food trail"],
          stayBase: "Lake Road area",
          fixedPlans: true,
          durationLabel: "Weekend",
          destinations: ["Kodaikanal Lake", "Pillar Rocks"],
          hotels: [{ name: "Lake View Residency", area: "Lake Road", budget: "Moderate" }],
          polls: [{ question: "Day 2 plan", options: ["Trek", "Food trail", "Boating"] }],
          inspirationLinks: [{ url: "https://example.com/kodaiguide", note: "Local guide ideas" }],
          daySuggestions: [
            { id: "kodai-s1", title: "Coaker's Walk", category: "Sight", startTime: "08:00", endTime: "09:30", openFrom: "06:00", openTo: "18:00", travelMins: 20, proposedBy: "jonah", mustSee: true },
            { id: "kodai-s2", title: "Bryant Park", category: "Sight", startTime: "10:00", endTime: "11:30", openFrom: "08:00", openTo: "18:00", travelMins: 15, proposedBy: "durga", mustSee: false },
            { id: "kodai-s3", title: "Pillar Rocks", category: "Sight", startTime: "12:15", endTime: "14:00", openFrom: "09:00", openTo: "17:00", travelMins: 35, proposedBy: "aruna", mustSee: true },
            { id: "kodai-s4", title: "Lake Boating", category: "Activity", startTime: "15:00", endTime: "16:30", openFrom: "09:00", openTo: "17:30", travelMins: 25, proposedBy: "bhavna", mustSee: false },
            { id: "kodai-s5", title: "Dinner at Astoria", category: "Food", startTime: "19:00", endTime: "20:30", openFrom: "18:30", openTo: "22:30", travelMins: 30, proposedBy: "angel", mustSee: false }
          ],
          activityFocus: ["Hiking", "Local Food Trail", "Sunset Viewpoint"],
          acceptedSuggestionIds: ["kodai-s1", "kodai-s3", "kodai-s5"],
          decisionLog: [
            { text: "Included Coaker's Walk as a must-see anchor", ts: "2026-05-10T09:30:00.000Z" },
            { text: "Kept Bryant Park optional to avoid midday rush", ts: "2026-05-10T09:34:00.000Z" }
          ]
        },
        {
          id: "pondy-long-weekend-2",
          name: "Pondy Long Weekend",
          destination: "Pondicherry",
          startDate: plusDays(42),
          endDate: plusDays(45),
          communityId: "GSF103",
          stage: "Idea",
          activities: ["French Quarter walk", "Beach sunrise", "Cafe poll"],
          stayBase: "White Town",
          fixedPlans: false,
          durationLabel: "5 days",
          destinations: ["White Town", "Rock Beach"],
          hotels: [{ name: "Sea Breeze Hotel", area: "Beach Road", budget: "Budget" }],
          polls: [{ question: "Evening plan", options: ["Promenade walk", "Cafe hopping"] }],
          inspirationLinks: [{ url: "https://example.com/pondy-itinerary", note: "Weekend itinerary" }],
          daySuggestions: [
            { id: "pondy-s1", title: "Promenade Sunrise Walk", category: "Activity", startTime: "06:30", endTime: "07:30", openFrom: "05:30", openTo: "10:00", travelMins: 15, proposedBy: "george", mustSee: false },
            { id: "pondy-s2", title: "Aurobindo Ashram Visit", category: "Sight", startTime: "10:00", endTime: "11:00", openFrom: "08:00", openTo: "12:00", travelMins: 20, proposedBy: "aruna", mustSee: true },
            { id: "pondy-s3", title: "French Quarter Cafe hopping", category: "Food", startTime: "17:00", endTime: "19:00", openFrom: "16:00", openTo: "22:00", travelMins: 20, proposedBy: "durga", mustSee: false }
          ],
          activityFocus: ["Chill at Beach", "Cafe hopping", "Museum"],
          acceptedSuggestionIds: [],
          decisionLog: [{ text: "Need to finalize one agreed day plan before booking", ts: "2026-06-22T10:00:00.000Z" }]
        }
      ]
    };
  }

  function getTripStage(trip) {
    if (TRIP_STAGES.includes(trip.stage)) return trip.stage;
    const delta = daysFromNow(trip.startDate);
    if (delta === null) return "Planning";
    if (delta < 0) return "Completed";
    if (delta <= 7) return "Confirmed";
    return "Planning";
  }

  function normalizeState(rawState) {
    const normalized = {
      availabilityMode: rawState.availabilityMode || "free",
      markedDays: rawState.markedDays || {},
      preferences: {
        budget: rawState.preferences?.budget || "Moderate",
        experiences: Array.isArray(rawState.preferences?.experiences)
          ? rawState.preferences.experiences.filter((item) => EXPERIENCE_TYPES.includes(item))
          : ["City", "Nature"],
        pace: normalizePace(rawState.preferences?.pace),
        stay: rawState.preferences?.stay || "Hotel"
      },
      contact: {
        email: rawState.contact?.email || "",
        phone: rawState.contact?.phone || "",
        emergencyName: rawState.contact?.emergencyName || "",
        emergencyPhone: rawState.contact?.emergencyPhone || ""
      },
      communities: Array.isArray(rawState.communities)
        ? rawState.communities.map((community) => ({
            ...community,
            memberProfiles: Array.isArray(community.memberProfiles) ? community.memberProfiles : [],
            polls: Array.isArray(community.polls) ? community.polls : []
          }))
        : [],
      trips: Array.isArray(rawState.trips)
        ? rawState.trips.map((trip, index) => ({
            ...trip,
            id: trip.id || toTripId(`${trip.name}-${trip.startDate}`, index),
            stage: getTripStage(trip),
            stayBase: trip.stayBase || "",
            fixedPlans: !!trip.fixedPlans,
            durationLabel: trip.durationLabel || "",
            destinations: Array.isArray(trip.destinations) ? trip.destinations : [],
            hotels: Array.isArray(trip.hotels) ? trip.hotels : [],
            polls: Array.isArray(trip.polls) ? trip.polls : [],
            inspirationLinks: Array.isArray(trip.inspirationLinks) ? trip.inspirationLinks : [],
            daySuggestions: Array.isArray(trip.daySuggestions)
              ? trip.daySuggestions.map((suggestion, suggestionIndex) => ({
                  id: suggestion.id || `trip-${index + 1}-suggestion-${suggestionIndex + 1}`,
                  title: suggestion.title || "Untitled plan item",
                  category: suggestion.category || "Activity",
                  startTime: suggestion.startTime || "",
                  endTime: suggestion.endTime || "",
                  openFrom: suggestion.openFrom || "",
                  openTo: suggestion.openTo || "",
                  travelMins: Number.isFinite(Number(suggestion.travelMins)) ? Number(suggestion.travelMins) : 0,
                  proposedBy: suggestion.proposedBy || "Unknown",
                  mustSee: !!suggestion.mustSee
                }))
              : [],
            activityFocus: Array.isArray(trip.activityFocus) ? trip.activityFocus : [],
            acceptedSuggestionIds: Array.isArray(trip.acceptedSuggestionIds) ? trip.acceptedSuggestionIds : [],
            decisionLog: Array.isArray(trip.decisionLog) ? trip.decisionLog : []
          }))
        : []
    };
    const renameMap = {
      Jonah: "jonah",
      jonah: "jonah",
      Durga: "durga",
      durga: "durga",
      Aruna: "aruna",
      aruna: "aruna",
      Bhavna: "bhavna",
      bhavna: "bhavna",
      Angel: "angel",
      angel: "angel",
      George: "george",
      george: "george",
      Jayaraj: "george",
      jayaraj: "george",
      "Mira Hale": "jonah",
      "Theo Quinn": "durga",
      "Lena Park": "aruna",
      "Niko Reyes": "bhavna",
      "Sana Vale": "angel",
      "Ravi Cole": "george"
    };
    const rewriteName = (value) => renameMap[value] || String(value || "").toLowerCase();
    normalized.communities.forEach((community) => {
      if (community.name === "GradSchool Friends" || community.name === "Blue Lantern Circle") community.name = "The Jackets";
      if (Array.isArray(community.members)) community.members = community.members.map((member) => rewriteName(member));
      if (Array.isArray(community.memberProfiles)) {
        community.memberProfiles = community.memberProfiles.map((profile) => ({
          ...profile,
          name: rewriteName(profile.name || ""),
          pace: normalizePace(profile.pace),
          mustDo: Array.isArray(profile.mustDo) ? profile.mustDo : []
        }));
      }
      ensureCommunityProfiles(community);
    });
    normalized.trips.forEach((trip) => {
      if (Array.isArray(trip.daySuggestions)) {
        trip.daySuggestions = trip.daySuggestions.map((item) => ({
          ...item,
          proposedBy: rewriteName(item.proposedBy || "")
        }));
      }
      if (!Array.isArray(trip.activityFocus)) trip.activityFocus = [];
    });
    if (normalized.contact.emergencyName) normalized.contact.emergencyName = rewriteName(normalized.contact.emergencyName);
    seedPollsIfMissing(normalized);
    return normalized;
  }

  function seedPollsIfMissing(data) {
    const groupPollCount = data.communities.reduce((acc, community) => acc + (Array.isArray(community.polls) ? community.polls.length : 0), 0);
    const tripPollCount = data.trips.reduce((acc, trip) => acc + (Array.isArray(trip.polls) ? trip.polls.length : 0), 0);
    if (groupPollCount + tripPollCount > 0) return;

    if (data.communities[0]) data.communities[0].polls = DEFAULT_GROUP_POLLS.map((poll) => ({ ...poll }));
    data.trips.slice(0, 2).forEach((trip, index) => {
      trip.polls = [
        ...(trip.polls || []),
        { ...DEFAULT_TRIP_POLLS[index % DEFAULT_TRIP_POLLS.length] }
      ];
    });
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEYS.state);
    const parsed = raw ? parseJson(raw) : null;
    if (parsed && Array.isArray(parsed.communities) && Array.isArray(parsed.trips) && parsed.markedDays) {
      const normalized = normalizeState(parsed);
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(normalized));
      return normalized;
    }
    const initial = defaultState();
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(initial));
    return initial;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
  }

  function enforceAuth() {
    if (localStorage.getItem(STORAGE_KEYS.auth) === "1") return true;
    const next = encodeURIComponent(window.location.pathname.split("/").pop() || "mtg-profile.html");
    window.location.href = `index.html?next=${next}`;
    return false;
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEYS.auth);
    window.location.href = "index.html";
  }

  function initGenieWidget() {
    if (document.getElementById("genieFab")) return;

    const fab = document.createElement("button");
    fab.id = "genieFab";
    fab.className = "genie-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Open Meet Your Genie by MTG");
    fab.setAttribute("title", "MTG: Meet The Genie");
    fab.innerHTML = `<img src="genie-lamp.png" alt="Meet the Genie">`;

    const panel = document.createElement("section");
    panel.id = "geniePanel";
    panel.className = "genie-panel hidden";
    panel.innerHTML = `
      <div class="genie-head">
        <div>
          <strong>Meet Your Genie by MTG</strong>
          <div class="small muted">Genie at your service</div>
        </div>
        <button class="genie-close" id="genieCloseBtn" type="button">×</button>
      </div>
      <div class="genie-messages" id="genieMessages"></div>
      <div class="genie-quick" id="genieQuick">
        <button class="genie-chip" type="button" data-prompt="Suggest best travel dates">Best dates</button>
        <button class="genie-chip" type="button" data-prompt="Show history destination options in India">History</button>
        <button class="genie-chip" type="button" data-prompt="Show beach destination options in India">Beach</button>
        <button class="genie-chip" type="button" data-prompt="Show mountain destination options in India">Mountain</button>
        <button class="genie-chip" type="button" data-prompt="Show city destination options in India">City</button>
        <button class="genie-chip" type="button" data-prompt="Show nature destination options in India">Nature</button>
      </div>
      <div class="genie-input">
        <input id="genieInput" type="text" placeholder="Ask Genie about your trip plan...">
        <button class="btn" id="genieSendBtn" type="button">Send</button>
      </div>
    `;

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    const messagesEl = byId("genieMessages");
    const inputEl = byId("genieInput");
    const saved = parseJson(localStorage.getItem(STORAGE_KEYS.genie));
    let destinationDb = [...DEFAULT_GENIE_DESTINATIONS];
    let chat = Array.isArray(saved) ? saved : [
      {
        role: "assistant",
        text: "Hi, I am your Genie. I can suggest India destinations (history, beach, mountain, city, nature) and build a practical trip plan from your group preferences."
      }
    ];

    fetch("genie-destinations-india.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Genie DB load failed: ${response.status}`);
        return response.json();
      })
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) destinationDb = rows;
      })
      .catch((error) => {
        console.warn(error.message);
      });

    function persistChat() {
      localStorage.setItem(STORAGE_KEYS.genie, JSON.stringify(chat.slice(-40)));
    }

    function renderChat() {
      if (!messagesEl) return;
      messagesEl.innerHTML = "";
      chat.forEach((item) => {
        const bubble = document.createElement("div");
        bubble.className = `genie-bubble ${item.role}`;
        bubble.textContent = item.text;
        messagesEl.appendChild(bubble);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function buildGenieReply(userText) {
      const text = String(userText || "").toLowerCase();
      const trip = getTripById(selectedTripId) || state.trips[0];
      const group = trip ? getCommunityById(trip.communityId) : null;
      if (!trip) return "Let us add a trip first. Once you add one, I can suggest dates, hotels, and polls.";

      const categoryHints = ["history", "beach", "mountain", "city", "nature"];
      const categoryMatch = categoryHints.find((cat) => text.includes(cat));
      if (categoryMatch) {
        const options = destinationDb.filter((item) => String(item.category || "").toLowerCase().includes(categoryMatch)).slice(0, 2);
        if (!options.length) return `I do not have ${categoryMatch} picks right now. Try another vibe.`;
        const list = options.map((item) => `${item.name}: ${(item.highlights || []).slice(0, 2).join(", ")} (Weather ${item.weatherRangeF || "varies"}°F)`).join("\n");
        return `Top ${categoryMatch} suggestions in India:\n${list}\nI can convert this into a destination poll for your group.`;
      }

      if (text.includes("date") || text.includes("day") || text.includes("availability")) {
        const overlap = buildGroupAvailabilitySnapshot(trip, group).sort((a, b) => b.availableMembers - a.availableMembers).slice(0, 3);
        const best = overlap.map((d) => `${d.date} (${d.availableMembers}/${d.totalMembers})`).join(", ");
        return `For ${trip.name}, top overlap days are: ${best || "not enough data yet"}.\nI suggest locking dates first, then finalizing hotels.`;
      }
      if (text.includes("hotel") || text.includes("stay")) {
        const shortlist = (trip.hotels || []).map((h) => `${h.name} (${h.area})`).join(", ");
        return shortlist
          ? `Current hotel shortlist for ${trip.name}: ${shortlist}.\nWant me to draft a hotel comparison poll?`
          : `No hotels saved for ${trip.name} yet.\nYou can add 2-3 options and I will help draft a quick vote poll.`;
      }
      if (text.includes("poll") || text.includes("vote")) {
        return `Try this poll:\n"Which plan should we finalize for ${trip.destination}?"\nOptions: Stay + Food, Adventure + Scenic, Relaxed + Local.\nI can also generate destination/hotel/activity-specific poll options.`;
      }
      if (text.includes("budget") || text.includes("cost")) {
        return `Based on your profile, current trip style is ${state.preferences.budget} and ${normalizePace(state.preferences.pace)}.\nI recommend splitting plans into must-have vs nice-to-have before finalizing bookings.`;
      }
      return `For ${trip.name}, I can help with:\n1. Best date overlap by group availability\n2. Destination + hotel shortlisting\n3. Poll templates for fast decisions\n4. Day-wise plan draft from your preferences`;
    }

    function sendMessage(promptText) {
      const text = (promptText || inputEl?.value || "").trim();
      if (!text) return;
      chat.push({ role: "user", text });
      if (inputEl) inputEl.value = "";
      renderChat();
      const placeholder = { role: "assistant", text: "Genie is planning this..." };
      chat.push(placeholder);
      renderChat();
      setTimeout(() => {
        placeholder.text = buildGenieReply(text);
        persistChat();
        renderChat();
      }, 480);
    }

    byId("genieSendBtn")?.addEventListener("click", () => sendMessage());
    byId("genieInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
    byId("genieCloseBtn")?.addEventListener("click", () => panel.classList.add("hidden"));
    fab.addEventListener("click", () => {
      if (panel.classList.contains("hidden")) {
        fab.classList.remove("pop");
        void fab.offsetWidth;
        fab.classList.add("pop");
        panel.classList.remove("hidden");
        panel.classList.add("opening");
        window.setTimeout(() => {
          panel.classList.remove("opening");
          byId("genieInput")?.focus();
        }, 280);
      } else {
        panel.classList.add("hidden");
      }
    });
    Array.from(panel.querySelectorAll(".genie-chip")).forEach((chip) => {
      chip.addEventListener("click", () => sendMessage(chip.getAttribute("data-prompt") || ""));
    });

    persistChat();
    renderChat();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = byId("themeToggle");
    if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.theme) || "light";
    applyTheme(saved);
    const toggle = byId("themeToggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  function initNavigation() {
    const page = document.body.dataset.page || "profile";
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    navLinks.forEach((link) => {
      const key = link.dataset.page;
      link.classList.toggle("active", key === page);
    });
    const active = navLinks.find((link) => link.dataset.page === page);
    const topCurrent = byId("topCurrentSection");
    if (topCurrent && active) topCurrent.textContent = active.textContent.trim();

    const accountNav = byId("accountNav");
    if (accountNav) {
      const goProfile = () => { window.location.href = PAGE_FILES.profile; };
      accountNav.addEventListener("click", goProfile);
      accountNav.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goProfile();
        }
      });
    }

    const topbarRow = document.querySelector(".topbar .row");
    if (topbarRow && !topbarRow.querySelector(".signout-btn")) {
      const signOutBtn = document.createElement("button");
      signOutBtn.type = "button";
      signOutBtn.className = "btn btn-secondary signout-btn";
      signOutBtn.textContent = "Sign out";
      signOutBtn.addEventListener("click", signOut);
      topbarRow.appendChild(signOutBtn);
    }
  }

  function currentMonthDays() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  function updateAvailabilitySummary() {
    const target = byId("availabilitySummary");
    if (!target) return;
    const free = Object.values(state.markedDays).filter((v) => v === "free").length;
    const busy = Object.values(state.markedDays).filter((v) => v === "busy").length;
    target.textContent = `Marked days: ${free} free, ${busy} busy`;
  }

  function renderCalendar() {
    const target = byId("calendar");
    if (!target) return;
    target.innerHTML = "";
    const mode = byId("availabilityMode");
    const selected = mode ? mode.value : state.availabilityMode;
    const days = currentMonthDays();
    for (let day = 1; day <= days; day += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day";
      button.textContent = String(day);
      const status = state.markedDays[String(day)];
      if (status) button.classList.add(status);
      button.addEventListener("click", () => {
        const key = String(day);
        state.markedDays[key] = state.markedDays[key] === selected ? "" : selected;
        if (!state.markedDays[key]) delete state.markedDays[key];
        saveState();
        renderCalendar();
        updateAvailabilitySummary();
      });
      target.appendChild(button);
    }
    updateAvailabilitySummary();
  }

  function renderPreferences() {
    const budgetSelect = byId("preferenceBudget");
    if (budgetSelect) budgetSelect.value = state.preferences?.budget || "Moderate";
    const paceSelect = byId("preferencePace");
    if (paceSelect) paceSelect.value = normalizePace(state.preferences?.pace);
    const staySelect = byId("preferenceStay");
    if (staySelect) staySelect.value = state.preferences?.stay || "Hotel";
    const experienceChecks = Array.from(document.querySelectorAll("#experiencePreferences input[type='checkbox']"));
    experienceChecks.forEach((input) => {
      input.checked = !!state.preferences?.experiences?.includes(input.value);
    });
  }

  function renderContactDetails() {
    const email = byId("profileEmailInput");
    const phone = byId("profilePhoneInput");
    const emergencyName = byId("emergencyNameInput");
    const emergencyPhone = byId("emergencyPhoneInput");
    if (email) email.value = state.contact?.email || "";
    if (phone) phone.value = state.contact?.phone || "";
    if (emergencyName) emergencyName.value = state.contact?.emergencyName || "";
    if (emergencyPhone) emergencyPhone.value = state.contact?.emergencyPhone || "";
  }

  function ensureCommunitySelect() {
    const select = byId("tripCommunitySelect");
    if (select) {
      select.innerHTML = "";
      state.communities.forEach((community) => {
        const option = document.createElement("option");
        option.value = community.id;
        option.textContent = `${community.name} (${community.id})`;
        select.appendChild(option);
      });
    }

    const list = byId("tripCommunityList");
    if (list) {
      list.innerHTML = "";
      state.communities.forEach((community) => {
        const byNameAndId = document.createElement("option");
        byNameAndId.value = `${community.name} (${community.id})`;
        list.appendChild(byNameAndId);

        const byId = document.createElement("option");
        byId.value = community.id;
        list.appendChild(byId);
      });
    }

    const input = byId("tripCommunityInput");
    if (input && !input.value) {
      const preferred = state.communities.find((community) => community.id === selectedCommunityId) || state.communities[0];
      if (preferred) input.value = `${preferred.name} (${preferred.id})`;
    }
  }

  function resolveCommunityId(rawValue) {
    const value = (rawValue || "").trim();
    if (!value) return "";
    const direct = state.communities.find((community) => community.id.toUpperCase() === value.toUpperCase());
    if (direct) return direct.id;

    const idMatch = value.match(/\(([^)]+)\)\s*$/);
    if (idMatch) {
      const fromBrackets = idMatch[1].trim().toUpperCase();
      const byBracketId = state.communities.find((community) => community.id.toUpperCase() === fromBrackets);
      if (byBracketId) return byBracketId.id;
    }

    const byName = state.communities.find((community) => community.name.toLowerCase() === value.toLowerCase());
    return byName ? byName.id : "";
  }

  function inferPollType(question) {
    const text = String(question || "").toLowerCase();
    if (text.includes("destination")) return "Destination";
    if (text.includes("hotel") || text.includes("stay")) return "Hotel";
    if (text.includes("activity") || text.includes("plan")) return "Activity";
    return "General";
  }

  function applyInitialSelectionFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const tripToken = params.get("trip");
    const groupToken = params.get("group");
    if (groupToken) {
      const resolvedGroup = resolveCommunityId(groupToken);
      if (resolvedGroup) selectedCommunityId = resolvedGroup;
    }
    if (tripToken) {
      const matchTrip = state.trips.find((trip) => trip.id === tripToken);
      if (matchTrip) {
        selectedTripId = matchTrip.id;
        if (matchTrip.communityId) selectedCommunityId = matchTrip.communityId;
      }
    }
  }

  function renderCommunities() {
    const list = byId("communityList");
    if (!list) return;
    list.innerHTML = "";
    if (!selectedCommunityId || !state.communities.some((community) => community.id === selectedCommunityId)) {
      selectedCommunityId = state.communities[0]?.id || null;
    }
    state.communities.forEach((community) => {
      const row = document.createElement("div");
      row.className = "list-line selectable";
      if (community.id === selectedCommunityId) row.classList.add("selected");
      row.tabIndex = 0;
      row.innerHTML = `<strong>${community.name}</strong> (${community.id})<br><span class="small muted">${community.members.join(", ")}</span>`;
      const pickGroup = () => {
        selectedCommunityId = community.id;
        renderCommunities();
        renderSelectedGroupTrips();
      };
      row.addEventListener("click", pickGroup);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pickGroup();
        }
      });
      list.appendChild(row);
    });
    ensureCommunitySelect();
    renderSelectedGroupTrips();
  }

  function renderSelectedGroupTrips() {
    const target = byId("selectedGroupTrips");
    if (!target) return;
    target.innerHTML = "";
    if (!selectedCommunityId) {
      target.innerHTML = `<div class="list-line muted">No groups available yet.</div>`;
      return;
    }
    const selectedGroup = state.communities.find((community) => community.id === selectedCommunityId);
    if (!selectedGroup) {
      target.innerHTML = `<div class="list-line muted">Pick a group to view trips.</div>`;
      return;
    }
    const groupTrips = state.trips.filter((trip) => trip.communityId === selectedCommunityId);
    if (!groupTrips.length) {
      target.innerHTML = `<div class="list-line muted">No trips in <strong>${selectedGroup.name}</strong> yet.</div>`;
      return;
    }
    groupTrips.forEach((trip) => {
      const row = document.createElement("div");
      row.className = "list-line selectable";
      row.tabIndex = 0;
      row.innerHTML = `<strong>${trip.name}</strong> • ${trip.destination}<br><span class="small muted">${trip.startDate} → ${trip.endDate} • Stage: <strong>${getTripStage(trip)}</strong></span>`;
      const openTrip = () => {
        window.location.href = `trips.html?trip=${encodeURIComponent(trip.id)}`;
      };
      row.addEventListener("click", openTrip);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTrip();
        }
      });
      target.appendChild(row);
    });
  }

  function createCommunity() {
    const input = byId("communityNameInput");
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    const id = `${name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    state.communities.push({
      id,
      name,
      members: ["george"],
      memberProfiles: [{ name: "george", style: "Logistics Lead", pace: "Moderate", mustDo: ["Local Food Trail", "Live Music"] }],
      polls: []
    });
    input.value = "";
    saveState();
    renderAll();
  }

  function joinCommunityById() {
    const input = byId("joinCommunityIdInput");
    if (!input) return;
    const id = input.value.trim().toUpperCase();
    if (!id) return;
    if (state.communities.some((c) => c.id === id)) {
      input.value = "";
      return;
    }
    const match = discoverableCommunityById[id];
    if (!match) return;
    state.communities.push({ id, name: match.name, members: match.members.slice(), memberProfiles: [], polls: [] });
    input.value = "";
    saveState();
    renderAll();
  }

  function daysFromNow(isoDate) {
    if (!isoDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(isoDate);
    if (Number.isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
  }

  function parseIsoDate(isoDate) {
    const value = new Date(isoDate);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  function formatTripDates(startDate, endDate) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end) return "Pick start and end dates";
    return `${DATE_FORMATTER.format(start)} – ${DATE_FORMATTER.format(end)}`;
  }

  function getTripDurationDays(startDate, endDate) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end || end < start) return 0;
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor((endDay - startDay) / 86400000) + 1;
  }

  function timeToMinutes(value) {
    if (!value || !/^\d{2}:\d{2}$/.test(String(value))) return null;
    const [hour, minute] = value.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return (hour * 60) + minute;
  }

  function deriveSeason(startDate) {
    const date = parseIsoDate(startDate);
    const month = date ? date.getMonth() + 1 : 0;
    if ([12, 1, 2].includes(month)) {
      return {
        season: "❄️ Winter Season",
        demand: "Low Season",
        weather: "28°F – 46°F",
        notes: "Cold temperatures, possible snow, shorter days",
        vibes: ["Fairytale Escape", "Wellness Escape"]
      };
    }
    if ([3, 4, 5].includes(month)) {
      return {
        season: "🌸 Spring Season",
        demand: "Shoulder Season",
        weather: "48°F – 68°F",
        notes: "Pleasant weather and flowering landscapes",
        vibes: ["Cultural Discovery", "Cafe + Street Walks"]
      };
    }
    if ([6, 7, 8].includes(month)) {
      return {
        season: "☀️ Summer Season",
        demand: "High Season",
        weather: "64°F – 86°F",
        notes: "Long days, peak activity, warm weather",
        vibes: ["Adventure Sprint", "Beach + Social Escape"]
      };
    }
    return {
      season: "🍂 Autumn Season",
      demand: "Shoulder Season",
      weather: "45°F – 66°F",
      notes: "Mild weather with scenic seasonal colors",
      vibes: ["Slow Travel", "Food + Festival Trails"]
    };
  }

  function updateDurationPresetActive(label) {
    const chips = Array.from(document.querySelectorAll("#durationPresets .duration-chip"));
    chips.forEach((chip) => chip.classList.toggle("active", chip.dataset.label === label));
  }

  function updateTripBuilderDetails() {
    const startInput = byId("tripStartInput");
    const endInput = byId("tripEndInput");
    const dateSummary = byId("tripDateSummary");
    const seasonLabel = byId("tripSeasonLabel");
    const seasonWindow = byId("tripSeasonWindow");
    const demandLabel = byId("tripDemandLabel");
    const weather = byId("tripWeather");
    const vibes = byId("tripVibes");
    if (!startInput || !endInput || !dateSummary || !seasonLabel || !seasonWindow || !demandLabel || !weather || !vibes) return;

    const dateText = formatTripDates(startInput.value, endInput.value);
    const duration = getTripDurationDays(startInput.value, endInput.value);
    dateSummary.textContent = duration > 0 ? `${dateText} • ${duration} day${duration === 1 ? "" : "s"}` : dateText;

    const season = deriveSeason(startInput.value || endInput.value);
    seasonLabel.innerHTML = `<strong>${season.season}</strong>`;
    seasonWindow.textContent = `${dateText}${startInput.value ? `, ${new Date(startInput.value).getFullYear()}` : ""}`;
    demandLabel.textContent = season.demand;
    weather.textContent = `${season.weather} • ${season.notes}`;
    vibes.innerHTML = `${season.vibes[0]}<br>${season.vibes[1]}`;
  }

  function renderUpcoming() {
    const container = byId("upcomingTrips");
    if (!container) return;
    container.innerHTML = "";
    const items = state.trips.filter((trip) => {
      const delta = daysFromNow(trip.startDate);
      return delta !== null && delta >= 0 && delta <= 60;
    });
    if (!items.length) {
      container.innerHTML = `<div class="list-line muted">No upcoming trips in the next 60 days.</div>`;
      return;
    }
    items.forEach((trip) => {
      const group = state.communities.find((c) => c.id === trip.communityId)?.name || trip.communityId;
      const row = document.createElement("div");
      row.className = "list-line";
      row.innerHTML = `<strong>${trip.name}</strong> • ${trip.destination}<br><span class="small muted">${trip.startDate} → ${trip.endDate} • ${group} • Stage: <strong>${getTripStage(trip)}</strong></span>`;
      container.appendChild(row);
    });
  }

  function renderUpcomingPolls() {
    const container = byId("upcomingPolls");
    if (!container) return;
    container.innerHTML = "";

    const upcomingTrips = state.trips.filter((trip) => {
      const delta = daysFromNow(trip.startDate);
      return delta !== null && delta >= 0 && delta <= 60;
    });

    const tripPollRows = upcomingTrips.flatMap((trip) => {
      const polls = Array.isArray(trip.polls) ? trip.polls : [];
      return polls.map((poll) => ({
        sourceType: "trip",
        question: poll.question || "Trip poll",
        options: Array.isArray(poll.options) ? poll.options : [],
        pollType: inferPollType(poll.question),
        trip,
        group: getCommunityById(trip.communityId)
      }));
    });

    const groupPollRows = state.communities.flatMap((group) => {
      const polls = Array.isArray(group.polls) ? group.polls : [];
      return polls.map((poll) => ({
        sourceType: "group",
        question: poll.question || "Group poll",
        options: Array.isArray(poll.options) ? poll.options : [],
        pollType: inferPollType(poll.question),
        group
      }));
    });

    const allPolls = [...tripPollRows, ...groupPollRows];
    if (!allPolls.length) {
      container.innerHTML = `<div class="list-line muted">No active polls found.</div>`;
      return;
    }

    allPolls.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "list-line";
      const groupName = entry.group?.name || "-";
      const tripName = entry.trip?.name || "-";
      const optionsText = entry.options.length ? entry.options.join(" • ") : "No options listed";
      const tripLink = entry.trip ? `trips.html?trip=${encodeURIComponent(entry.trip.id)}` : `trips.html?group=${encodeURIComponent(entry.group?.id || "")}`;
      const groupLink = `groups.html?group=${encodeURIComponent(entry.group?.id || "")}`;

      row.innerHTML = `
        <strong>${entry.pollType} Poll:</strong> ${entry.question}
        <br><span class="small muted">From ${entry.sourceType === "trip" ? `Trip: ${tripName}` : `Group: ${groupName}`}</span>
        <br><span class="small muted">${optionsText}</span>
        <div class="row" style="margin-top:8px;">
          <a class="btn btn-secondary" href="${tripLink}">Go to Trip</a>
          <a class="btn btn-secondary" href="${groupLink}">Go to Group</a>
        </div>
      `;
      container.appendChild(row);
    });
  }

  function renderTrips() {
    const container = byId("yourTrips");
    if (!container) return;
    container.innerHTML = "";
    if (!state.trips.length) {
      selectedTripId = null;
      container.innerHTML = `<div class="list-line muted">No trips yet.</div>`;
      renderTripPlanningWorkspace();
      return;
    }
    if (!selectedTripId || !state.trips.some((trip) => trip.id === selectedTripId)) selectedTripId = state.trips[0].id;
    state.trips.forEach((trip) => {
      const row = document.createElement("div");
      const groupName = state.communities.find((group) => group.id === trip.communityId)?.name || trip.communityId;
      row.className = "list-line selectable";
      if (trip.id === selectedTripId) row.classList.add("selected");
      row.tabIndex = 0;
      row.innerHTML = `<strong>${trip.name}</strong> • ${trip.destination}<br><span class="small muted">${trip.startDate} → ${trip.endDate} • ${groupName} • Stage: <strong>${getTripStage(trip)}</strong></span>`;
      const pickTrip = () => {
        selectedTripId = trip.id;
        renderTrips();
      };
      row.addEventListener("click", pickTrip);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pickTrip();
        }
      });
      container.appendChild(row);
    });
    renderTripPlanningWorkspace();
    renderDayPlanAgreement();
  }

  function setTripSetupVisible(visible, options = {}) {
    const section = byId("newTripSection");
    if (!section) return;
    section.classList.toggle("trip-setup-hidden", !visible);
    const openBtn = byId("openTripSetupBtn");
    if (openBtn) openBtn.classList.toggle("hidden", visible);
    if (visible && options.scroll) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function syncTripSetupWithLocation() {
    if (document.body.dataset.page !== "trips") return;
    const shouldOpen = window.location.hash === "#newTripSection";
    setTripSetupVisible(shouldOpen, { scroll: shouldOpen });
  }

  function addTrip() {
    const nameInput = byId("tripNameInput");
    const destinationInput = byId("tripDestinationInput");
    const startInput = byId("tripStartInput");
    const endInput = byId("tripEndInput");
    const communitySelect = byId("tripCommunitySelect");
    const communityInput = byId("tripCommunityInput");
    if (!nameInput || !destinationInput || !startInput || !endInput) return;
    const name = nameInput.value.trim();
    const destination = destinationInput.value.trim();
    const startDate = startInput.value;
    const endDate = endInput.value;
    if (!name || !destination || !startDate || !endDate) return;
    const chosenCommunityId = communitySelect
      ? communitySelect.value
      : resolveCommunityId(communityInput ? communityInput.value : "");
    state.trips.push({
      id: toTripId(`${name}-${startDate}`, state.trips.length),
      name,
      destination,
      startDate,
      endDate,
      communityId: chosenCommunityId || state.communities[0]?.id || "",
      stage: "Planning",
      activities: [],
      stayBase: (byId("tripStayInput")?.value || "").trim(),
      fixedPlans: !!byId("tripFixedPlansInput")?.checked,
      durationLabel: Array.from(document.querySelectorAll("#durationPresets .duration-chip.active"))[0]?.dataset.label || "",
      destinations: [],
      hotels: [],
      polls: [],
      inspirationLinks: [],
      daySuggestions: [],
      activityFocus: [],
      acceptedSuggestionIds: [],
      decisionLog: [{ text: "Trip created. Start collecting one-day plan suggestions.", ts: new Date().toISOString() }]
    });
    selectedTripId = state.trips[state.trips.length - 1].id;
    nameInput.value = "";
    destinationInput.value = "";
    startInput.value = "";
    endInput.value = "";
    if (communityInput && state.communities[0]) {
      communityInput.value = `${state.communities[0].name} (${state.communities[0].id})`;
    }
    const stayInput = byId("tripStayInput");
    if (stayInput) stayInput.value = "";
    const fixedPlans = byId("tripFixedPlansInput");
    if (fixedPlans) fixedPlans.checked = false;
    updateDurationPresetActive("");
    saveState();
    renderAll();
    setTripSetupVisible(false);
    if (window.location.hash === "#newTripSection") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  function getTripById(id) {
    return state.trips.find((trip) => trip.id === id) || null;
  }

  function getCommunityById(id) {
    return state.communities.find((community) => community.id === id) || null;
  }

  function getSelectedTrip() {
    return getTripById(selectedTripId);
  }

  function ensureTripProjectArrays(trip) {
    if (!trip) return;
    if (!Array.isArray(trip.destinations)) trip.destinations = [];
    if (!Array.isArray(trip.hotels)) trip.hotels = [];
    if (!Array.isArray(trip.polls)) trip.polls = [];
    if (!Array.isArray(trip.inspirationLinks)) trip.inspirationLinks = [];
    if (!Array.isArray(trip.daySuggestions)) trip.daySuggestions = [];
    if (!Array.isArray(trip.activityFocus)) trip.activityFocus = [];
    if (!Array.isArray(trip.acceptedSuggestionIds)) trip.acceptedSuggestionIds = [];
    if (!Array.isArray(trip.decisionLog)) trip.decisionLog = [];
  }

  function getMemberProfileTemplate(name, index) {
    const key = String(name || "").toLowerCase();
    if (MEMBER_PROFILE_TEMPLATES[key]) return MEMBER_PROFILE_TEMPLATES[key];
    const fallback = Object.values(MEMBER_PROFILE_TEMPLATES)[index % Object.values(MEMBER_PROFILE_TEMPLATES).length];
    return fallback;
  }

  function ensureCommunityProfiles(community) {
    if (!community) return;
    if (!Array.isArray(community.memberProfiles)) community.memberProfiles = [];
    const currentProfiles = new Map(
      community.memberProfiles.map((profile) => [String(profile.name || "").toLowerCase(), profile])
    );
    community.memberProfiles = (community.members || []).map((member, index) => {
      const key = String(member || "").toLowerCase();
      const existing = currentProfiles.get(key);
      if (existing) {
        return {
          ...existing,
          name: key,
          pace: normalizePace(existing.pace),
          mustDo: Array.isArray(existing.mustDo) ? existing.mustDo : []
        };
      }
      const preset = getMemberProfileTemplate(key, index);
      return {
        name: key,
        style: preset.style,
        pace: preset.pace,
        mustDo: [...preset.mustDo]
      };
    });
  }

  function logTripDecision(trip, text) {
    ensureTripProjectArrays(trip);
    trip.decisionLog.unshift({ text, ts: new Date().toISOString() });
    trip.decisionLog = trip.decisionLog.slice(0, 12);
  }

  function buildAcceptedPlan(trip) {
    ensureTripProjectArrays(trip);
    const acceptedIds = new Set(trip.acceptedSuggestionIds);
    const accepted = trip.daySuggestions
      .filter((item) => acceptedIds.has(item.id))
      .slice()
      .sort((a, b) => (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0));

    const issues = [];
    let totalMinutes = 0;
    let previous = null;
    accepted.forEach((item) => {
      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);
      if (start === null || end === null || end <= start) {
        issues.push(`Invalid time block: ${item.title}`);
        return;
      }
      totalMinutes += (end - start);

      const openFrom = timeToMinutes(item.openFrom);
      const openTo = timeToMinutes(item.openTo);
      if (openFrom !== null && start < openFrom) issues.push(`${item.title} starts before opening hours`);
      if (openTo !== null && end > openTo) issues.push(`${item.title} ends after closing hours`);

      if (previous) {
        const travel = Math.max(0, Number(item.travelMins) || 0);
        if (start < previous.end) {
          issues.push(`${item.title} overlaps with ${previous.title}`);
        } else if ((start - previous.end) < travel) {
          issues.push(`${item.title} needs ${travel} mins travel after ${previous.title}, but only ${start - previous.end} mins available`);
        }
      }
      previous = { title: item.title, end };
    });
    return { accepted, issues, totalMinutes };
  }

  function renderDayPlanAgreement() {
    const poolEl = byId("suggestionPoolList");
    const acceptedEl = byId("acceptedPlanList");
    const acceptedMetaEl = byId("acceptedPlanMeta");
    const feasibilityEl = byId("feasibilitySummary");
    const tradeoffEl = byId("tradeoffList");
    const workloadEl = byId("workloadSummary");
    if (!poolEl || !acceptedEl || !acceptedMetaEl || !feasibilityEl || !tradeoffEl || !workloadEl) return;

    const trip = getSelectedTrip();
    if (!trip) {
      poolEl.innerHTML = `<div class="list-line muted">Select a trip to manage day-plan suggestions.</div>`;
      acceptedEl.innerHTML = `<div class="list-line muted">No accepted plan available.</div>`;
      acceptedMetaEl.textContent = "No accepted items yet.";
      feasibilityEl.innerHTML = `<div class="list-line muted">Feasibility appears once a plan is accepted.</div>`;
      tradeoffEl.innerHTML = `<div class="list-line muted">No trade-off decisions yet.</div>`;
      workloadEl.innerHTML = "";
      return;
    }

    ensureTripProjectArrays(trip);
    const acceptedIdSet = new Set(trip.acceptedSuggestionIds);
    const acceptedPlan = buildAcceptedPlan(trip);
    const acceptedCount = acceptedPlan.accepted.length;
    acceptedMetaEl.textContent = acceptedCount
      ? `${acceptedCount} accepted item${acceptedCount === 1 ? "" : "s"} • Planned activity time ${Math.round(acceptedPlan.totalMinutes / 60)}h ${acceptedPlan.totalMinutes % 60}m`
      : "No accepted items yet.";

    if (!trip.daySuggestions.length) {
      poolEl.innerHTML = `<div class="list-line muted">Add suggestions from your group to begin planning.</div>`;
    } else {
      poolEl.innerHTML = "";
      trip.daySuggestions.forEach((item) => {
        const row = document.createElement("div");
        row.className = "list-line";
        row.innerHTML = `
          <div class="row" style="justify-content:space-between; width:100%; align-items:flex-start;">
            <div>
              <strong>${item.title}</strong> <span class="small muted">(${item.category})</span>${item.mustSee ? ` <span class="decision-pill warn">Must-see</span>` : ""}
              <br><span class="small muted">${item.startTime || "--:--"} → ${item.endTime || "--:--"} • Open ${item.openFrom || "--:--"}-${item.openTo || "--:--"} • Travel ${item.travelMins || 0} mins • Suggested by ${item.proposedBy || "Unknown"}</span>
            </div>
          </div>
        `;
        const action = document.createElement("button");
        action.type = "button";
        action.className = "btn btn-secondary";
        action.textContent = acceptedIdSet.has(item.id) ? "Remove from accepted plan" : "Include in accepted plan";
        action.addEventListener("click", () => {
          ensureTripProjectArrays(trip);
          const currentlyAccepted = trip.acceptedSuggestionIds.includes(item.id);
          if (currentlyAccepted) {
            trip.acceptedSuggestionIds = trip.acceptedSuggestionIds.filter((id) => id !== item.id);
            logTripDecision(trip, `Removed ${item.title} from accepted plan`);
          } else {
            trip.acceptedSuggestionIds.push(item.id);
            logTripDecision(trip, `Included ${item.title} in accepted plan`);
          }
          saveState();
          renderDayPlanAgreement();
        });
        row.appendChild(action);
        poolEl.appendChild(row);
      });
    }

    if (!acceptedPlan.accepted.length) {
      acceptedEl.innerHTML = `<div class="list-line muted">No accepted items yet. Include suggestions to create a single agreed one-day plan.</div>`;
    } else {
      acceptedEl.innerHTML = "";
      acceptedPlan.accepted.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "list-line";
        row.innerHTML = `
          <strong>${index + 1}. ${item.title}</strong>
          <br><span class="small muted">${item.startTime} → ${item.endTime} • ${item.category}${item.mustSee ? " • Must-see" : ""}</span>
        `;
        acceptedEl.appendChild(row);
      });
    }

    const feasibilityBadge = acceptedPlan.issues.length ? "bad" : acceptedPlan.accepted.length ? "good" : "warn";
    const feasibilityLabel = acceptedPlan.issues.length
      ? "Conflicts found"
      : acceptedPlan.accepted.length
        ? "Feasible for now"
        : "Waiting for accepted plan";
    feasibilityEl.innerHTML = `
      <div class="row" style="margin-bottom:8px;"><span class="decision-pill ${feasibilityBadge}">${feasibilityLabel}</span></div>
      ${
        acceptedPlan.issues.length
          ? acceptedPlan.issues.map((issue) => `<div class="list-line small">${issue}</div>`).join("")
          : `<div class="list-line small muted">Opening hours, timing overlap, and travel buffers are currently valid.</div>`
      }
    `;

    const tradeoffRows = trip.decisionLog.length
      ? trip.decisionLog.map((entry) => `<div class="list-line small">${entry.text}<br><span class="muted">${new Date(entry.ts).toLocaleString()}</span></div>`).join("")
      : `<div class="list-line muted">No decisions recorded yet.</div>`;
    tradeoffEl.innerHTML = tradeoffRows;

    const community = getCommunityById(trip.communityId);
    const members = community?.members || [];
    const allNames = new Set([...members, ...trip.daySuggestions.map((item) => item.proposedBy).filter(Boolean)]);
    const contributionRows = Array.from(allNames).map((name) => {
      const inPool = trip.daySuggestions.filter((item) => item.proposedBy === name).length;
      const inPlan = trip.daySuggestions.filter((item) => item.proposedBy === name && acceptedIdSet.has(item.id)).length;
      return { name, inPool, inPlan };
    }).filter((row) => row.inPool > 0 || row.inPlan > 0);
    const maxShare = contributionRows.length
      ? Math.max(...contributionRows.map((row) => row.inPlan)) / Math.max(1, acceptedPlan.accepted.length)
      : 0;
    const fairnessNote = maxShare > 0.6
      ? `<span class="decision-pill warn">Coordination skewed</span> One person currently dominates accepted choices.`
      : `<span class="decision-pill good">Workload balanced</span> Accepted choices are fairly distributed so far.`;

    workloadEl.innerHTML = `
      <div class="small" style="margin-bottom:6px;">${fairnessNote}</div>
      ${
        contributionRows.length
          ? contributionRows.map((row) => `<div class="list-line small"><strong>${row.name}</strong> • Suggestions: ${row.inPool} • Accepted: ${row.inPlan}</div>`).join("")
          : `<div class="list-line muted">No participation data yet.</div>`
      }
    `;
  }

  function buildDates(startDate, endDate) {
    const list = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return list;
    const cursor = new Date(start);
    while (cursor <= end && list.length < 12) {
      list.push(toIsoDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return list;
  }

  function hashText(value) {
    return String(value).split("").reduce((acc, char) => ((acc * 33) + char.charCodeAt(0)) % 10007, 7);
  }

  function buildGroupAvailabilitySnapshot(trip, community) {
    const members = community?.members || [];
    const dates = buildDates(trip.startDate, trip.endDate);
    return dates.map((iso) => {
      const dayKey = String(new Date(iso).getDate());
      const userStatus = state.markedDays[dayKey];
      const base = userStatus === "free" ? 0.82 : userStatus === "busy" ? 0.36 : 0.58;
      const availableCount = members.reduce((count, member) => {
        const score = (hashText(`${member}-${iso}-${trip.id}`) % 100) / 100;
        return score <= base ? count + 1 : count;
      }, 0);
      return { date: iso, availableMembers: availableCount, totalMembers: members.length };
    });
  }

  function renderTripPlanningWorkspace() {
    const summary = byId("selectedTripSummary");
    const glance = byId("tripAtGlance");
    const profilesPanel = byId("groupProfileCards");
    const activityOptionsPanel = byId("activityQuickOptions");
    const activityPollStatus = byId("activityPollStatus");
    const aiOutput = byId("aiPlanOutput");
    if (!summary || !aiOutput || !glance || !profilesPanel || !activityOptionsPanel || !activityPollStatus) return;
    const trip = getTripById(selectedTripId);
    if (!trip) {
      summary.textContent = "Select a trip to start planning.";
      glance.textContent = "Pick a trip to see selected destinations and activity-poll status.";
      profilesPanel.innerHTML = `<div class="small muted">Select a trip to view group profiles.</div>`;
      activityOptionsPanel.innerHTML = `<div class="small muted">Select a trip to pick activity styles.</div>`;
      activityPollStatus.textContent = "Pick activities, then generate a quick poll.";
      aiOutput.textContent = "Select a trip and generate a plan.";
      return;
    }
    const community = getCommunityById(trip.communityId);
    ensureTripProjectArrays(trip);
    ensureCommunityProfiles(community);
    const groupName = community?.name || trip.communityId;
    const availability = buildGroupAvailabilitySnapshot(trip, community);
    const sortedByAvailability = [...availability].sort((a, b) => b.availableMembers - a.availableMembers).slice(0, 3);
    const planningFocus = byId("planningFocusSelect")?.value || "balanced";

    summary.innerHTML = `<strong>${trip.name}</strong> • ${trip.destination}<br><span class="small muted">Group: <strong>${groupName}</strong> (${community?.members?.length || 0} members) • Stage: <strong>${getTripStage(trip)}</strong> • Pace: <strong>${normalizePace(state.preferences?.pace)}</strong>${trip.stayBase ? ` • Stay: ${trip.stayBase}` : ""}${trip.fixedPlans ? " • 📌 Fixed plans added" : ""}</span>`;
    const destinationSummary = trip.destinations.length
      ? trip.destinations.map((d) => `<span class="glance-chip">${d}</span>`).join("")
      : `<span class="small muted">No destinations selected yet.</span>`;
    const activityPolls = (trip.polls || []).filter((poll) => inferPollType(poll.question) === "Activity");
    const hasActivityPolls = activityPolls.length > 0;
    glance.innerHTML = `
      <div><strong>Selected destinations</strong></div>
      <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">${destinationSummary}</div>
      <div style="margin-top:10px;"><strong>Activity preference poll</strong></div>
      <div class="small muted" style="margin-top:4px;">
        ${
          hasActivityPolls
            ? `${activityPolls.length} activity poll${activityPolls.length === 1 ? "" : "s"} ready for this trip.`
            : `No activity poll yet. Add one before finalizing 3-day activity split.`
        }
      </div>
      <div class="small muted" style="margin-top:6px;">Trip pace: <strong>${normalizePace(state.preferences?.pace)}</strong></div>
      ${
        hasActivityPolls
          ? ""
          : `<div class="row" style="margin-top:8px;"><button type="button" id="glanceAddPollBtn" class="btn btn-secondary">Add Activity Poll</button></div>`
      }
    `;
    byId("glanceAddPollBtn")?.addEventListener("click", () => {
      const optionalTools = document.querySelector("#planningWorkspaceSection .compact-details");
      if (optionalTools && optionalTools.tagName.toLowerCase() === "details") optionalTools.open = true;
      const pollInput = byId("pollQuestionInput");
      if (pollInput) pollInput.focus();
    });

    profilesPanel.innerHTML = (community?.memberProfiles || []).length
      ? community.memberProfiles.map((profile) => {
          const mustDo = Array.isArray(profile.mustDo) ? profile.mustDo : [];
          return `
            <div class="profile-card">
              <div class="profile-title">${profile.name}</div>
              <div class="profile-meta">${profile.style || "General"} • Pace: ${normalizePace(profile.pace)}</div>
              <div class="tag-row">${mustDo.map((item) => `<span class="tag-chip">${item}</span>`).join("")}</div>
            </div>
          `;
        }).join("")
      : `<div class="small muted">No member profiles yet.</div>`;

    const selectedActivities = new Set(trip.activityFocus || []);
    activityOptionsPanel.innerHTML = DAY_ACTIVITY_OPTIONS.map((option) => `
      <button type="button" class="activity-chip${selectedActivities.has(option) ? " active" : ""}" data-activity="${option}">${option}</button>
    `).join("");
    Array.from(activityOptionsPanel.querySelectorAll(".activity-chip")).forEach((chip) => {
      chip.addEventListener("click", () => {
        ensureTripProjectArrays(trip);
        const activity = chip.getAttribute("data-activity") || "";
        const existing = new Set(trip.activityFocus || []);
        if (existing.has(activity)) {
          existing.delete(activity);
        } else {
          existing.add(activity);
        }
        trip.activityFocus = Array.from(existing);
        saveState();
        renderTripPlanningWorkspace();
      });
    });
    const createActivityPollBtn = byId("createActivityPollBtn");
    if (createActivityPollBtn) {
      createActivityPollBtn.onclick = () => {
        ensureTripProjectArrays(trip);
        const options = (trip.activityFocus || []).slice(0, 6);
        const pollOptions = options.length ? options : DAY_ACTIVITY_OPTIONS.slice(0, 4);
        trip.polls.push({
          question: `Which activities should we prioritize for ${trip.name}?`,
          options: pollOptions
        });
        saveState();
        renderTripProjectWorkspace();
        renderTripPlanningWorkspace();
      };
    }
    activityPollStatus.textContent = (trip.activityFocus || []).length
      ? `Selected: ${(trip.activityFocus || []).join(", ")}`
      : "Pick activities, then generate a quick poll.";

    const recommendedDays = sortedByAvailability.map((d) => `${d.date} (${d.availableMembers}/${d.totalMembers})`).join(", ");
    aiOutput.innerHTML = `<strong>Suggested plan direction</strong><br><span class="small muted">Best overlap days: ${recommendedDays || "No overlap data yet"}<br>Style: ${state.preferences.budget}, ${state.preferences.pace}, ${state.preferences.experiences.join(", ") || "General"}<br>Planning focus: ${planningFocus}</span>`;
  }

  function renderTripProjectWorkspace() {
    const destinationList = byId("destinationList");
    const hotelList = byId("hotelList");
    const pollList = byId("pollList");
    const inspirationList = byId("inspirationList");
    if (!destinationList || !hotelList || !pollList || !inspirationList) return;
    const trip = getSelectedTrip();
    if (!trip) {
      destinationList.innerHTML = `<div class="project-item muted">Select a trip.</div>`;
      hotelList.innerHTML = `<div class="project-item muted">Select a trip.</div>`;
      pollList.innerHTML = `<div class="project-item muted">Select a trip.</div>`;
      inspirationList.innerHTML = `<div class="project-item muted">Select a trip.</div>`;
      return;
    }
    ensureTripProjectArrays(trip);

    destinationList.innerHTML = trip.destinations.length
      ? trip.destinations.map((d) => `<div class="project-item">${d}</div>`).join("")
      : `<div class="project-item muted">No destinations added yet.</div>`;

    hotelList.innerHTML = trip.hotels.length
      ? trip.hotels.map((h) => `<div class="project-item"><strong>${h.name}</strong><br><span class="small muted">${h.area} • ${h.budget}</span></div>`).join("")
      : `<div class="project-item muted">No hotels shortlisted yet.</div>`;

    pollList.innerHTML = trip.polls.length
      ? trip.polls.map((p) => `<div class="project-item"><strong>${p.question}</strong><br><span class="small muted">${(p.options || []).join(" • ")}</span></div>`).join("")
      : `<div class="project-item muted">No polls created yet.</div>`;

    inspirationList.innerHTML = trip.inspirationLinks.length
      ? trip.inspirationLinks.map((l) => `<div class="project-item"><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.url}</a><br><span class="small muted">${l.note || ""}</span></div>`).join("")
      : `<div class="project-item muted">No reference links yet.</div>`;
  }

  function updateTracker() {
    const groupCount = byId("communityCount");
    const tripCount = byId("tripCount");
    const planningCount = byId("planningCount");
    const committedCount = byId("committedCount");
    const upcomingCount = byId("upcomingCount");
    if (groupCount) groupCount.textContent = String(state.communities.length);
    if (tripCount) tripCount.textContent = String(state.trips.length);
    if (planningCount) planningCount.textContent = String(state.trips.filter((trip) => ["Idea", "Planning"].includes(getTripStage(trip))).length);
    if (committedCount) committedCount.textContent = String(state.trips.filter((trip) => ["Confirmed", "Booked", "In Progress"].includes(getTripStage(trip))).length);
    if (upcomingCount) {
      const upcoming = state.trips.filter((trip) => {
        const delta = daysFromNow(trip.startDate);
        return delta !== null && delta >= 0 && delta <= 60;
      }).length;
      upcomingCount.textContent = String(upcoming);
    }

    const stageChart = byId("tripStageChart");
    if (stageChart) {
      const stageCounts = TRIP_STAGES.map((stage) => ({
        stage,
        count: state.trips.filter((trip) => getTripStage(trip) === stage).length
      })).filter((item) => item.count > 0);
      const chartData = stageCounts.length ? stageCounts : [{ stage: "No data", count: 0 }];
      const maxCount = Math.max(1, ...chartData.map((item) => item.count));
      stageChart.innerHTML = chartData.map((item) => {
        const width = Math.max(8, Math.round((item.count / maxCount) * 100));
        return `
          <div class="stage-row">
            <div class="stage-label">${item.stage}</div>
            <div class="stage-track"><div class="stage-fill" style="width:${width}%"></div></div>
            <div class="stage-count">${item.count}</div>
          </div>
        `;
      }).join("");
    }

    const progressList = byId("tripProgressList");
    if (progressList) {
      progressList.innerHTML = "";
      if (!state.trips.length) {
        progressList.innerHTML = `<div class="list-line muted">No trips to track yet.</div>`;
      } else {
        const sorted = [...state.trips].sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
        sorted.forEach((trip) => {
          const groupName = getCommunityById(trip.communityId)?.name || trip.communityId;
          const row = document.createElement("div");
          row.className = "tracker-item";
          row.innerHTML = `
            <div>
              <strong>${trip.name}</strong> • ${trip.destination}
              <br><span class="small muted">${trip.startDate} → ${trip.endDate} • ${groupName}</span>
            </div>
            <span class="stage-chip">${getTripStage(trip)}</span>
          `;
          progressList.appendChild(row);
        });
      }
    }
  }

  function wireActions() {
    const mode = byId("availabilityMode");
    if (mode) {
      mode.value = state.availabilityMode || "free";
      mode.addEventListener("change", () => {
        state.availabilityMode = mode.value;
        saveState();
        renderCalendar();
      });
    }
    const createBtn = byId("createCommunityBtn");
    if (createBtn) createBtn.addEventListener("click", createCommunity);
    const joinBtn = byId("joinCommunityBtn");
    if (joinBtn) joinBtn.addEventListener("click", joinCommunityById);
    const addTripBtn = byId("addTripBtn");
    if (addTripBtn) addTripBtn.addEventListener("click", addTrip);
    const startInput = byId("tripStartInput");
    const endInput = byId("tripEndInput");
    if (startInput) startInput.addEventListener("change", updateTripBuilderDetails);
    if (endInput) endInput.addEventListener("change", updateTripBuilderDetails);

    const presetButtons = Array.from(document.querySelectorAll("#durationPresets .duration-chip"));
    presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const start = byId("tripStartInput");
        const end = byId("tripEndInput");
        if (!start || !end) return;
        if (!start.value) start.value = toIsoDate(new Date());
        const startDate = parseIsoDate(start.value);
        if (!startDate) return;
        const days = Number(button.dataset.days || "0");
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.max(0, days - 1));
        end.value = toIsoDate(endDate);
        updateDurationPresetActive(button.dataset.label || "");
        updateTripBuilderDetails();
      });
    });

    const continueBtn = byId("continueToWorkspaceBtn");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        const panel = byId("planningWorkspaceSection");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const openSetupBtn = byId("openTripSetupBtn");
    if (openSetupBtn) {
      openSetupBtn.addEventListener("click", () => {
        if (window.location.hash !== "#newTripSection") {
          window.location.hash = "newTripSection";
        } else {
          setTripSetupVisible(true, { scroll: true });
        }
      });
    }
    const closeSetupBtn = byId("closeTripSetupBtn");
    if (closeSetupBtn) {
      closeSetupBtn.addEventListener("click", () => {
        setTripSetupVisible(false);
        if (window.location.hash === "#newTripSection") {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }
      });
    }
    if (document.body.dataset.page === "trips") {
      window.addEventListener("hashchange", syncTripSetupWithLocation);
    }

    const budgetSelect = byId("preferenceBudget");
    if (budgetSelect) {
      budgetSelect.addEventListener("change", () => {
        state.preferences.budget = budgetSelect.value;
        saveState();
      });
    }
    const paceSelect = byId("preferencePace");
    if (paceSelect) {
      paceSelect.addEventListener("change", () => {
        state.preferences.pace = paceSelect.value;
        saveState();
      });
    }
    const staySelect = byId("preferenceStay");
    if (staySelect) {
      staySelect.addEventListener("change", () => {
        state.preferences.stay = staySelect.value;
        saveState();
      });
    }

    const experienceChecks = Array.from(document.querySelectorAll("#experiencePreferences input[type='checkbox']"));
    if (experienceChecks.length) {
      experienceChecks.forEach((input) => {
        input.addEventListener("change", () => {
          const selected = experienceChecks.filter((c) => c.checked).map((c) => c.value);
          state.preferences.experiences = selected;
          saveState();
        });
      });
    }

    const email = byId("profileEmailInput");
    const phone = byId("profilePhoneInput");
    const emergencyName = byId("emergencyNameInput");
    const emergencyPhone = byId("emergencyPhoneInput");
    if (email) {
      email.addEventListener("change", () => {
        state.contact.email = email.value.trim();
        saveState();
      });
    }
    if (phone) {
      phone.addEventListener("change", () => {
        state.contact.phone = phone.value.trim();
        saveState();
      });
    }
    if (emergencyName) {
      emergencyName.addEventListener("change", () => {
        state.contact.emergencyName = emergencyName.value.trim();
        saveState();
      });
    }
    if (emergencyPhone) {
      emergencyPhone.addEventListener("change", () => {
        state.contact.emergencyPhone = emergencyPhone.value.trim();
        saveState();
      });
    }

    const planningControls = ["planningFocusSelect", "optAvailability", "optBudget", "optExperience", "optPace"];
    planningControls.forEach((id) => {
      const control = byId(id);
      if (control) control.addEventListener("change", renderTripPlanningWorkspace);
    });

    const generatePlanBtn = byId("generatePlanBtn");
    if (generatePlanBtn) generatePlanBtn.addEventListener("click", renderTripPlanningWorkspace);

    const addDestinationBtn = byId("addDestinationBtn");
    if (addDestinationBtn) {
      addDestinationBtn.addEventListener("click", () => {
        const trip = getSelectedTrip();
        const input = byId("destinationInput");
        if (!trip || !input) return;
        const value = input.value.trim();
        if (!value) return;
        ensureTripProjectArrays(trip);
        trip.destinations.push(value);
        input.value = "";
        saveState();
        renderTripProjectWorkspace();
      });
    }

    const addHotelBtn = byId("addHotelBtn");
    if (addHotelBtn) {
      addHotelBtn.addEventListener("click", () => {
        const trip = getSelectedTrip();
        const nameInput = byId("hotelNameInput");
        const areaInput = byId("hotelAreaInput");
        const budgetInput = byId("hotelBudgetInput");
        if (!trip || !nameInput || !areaInput || !budgetInput) return;
        const name = nameInput.value.trim();
        const area = areaInput.value.trim();
        if (!name || !area) return;
        ensureTripProjectArrays(trip);
        trip.hotels.push({ name, area, budget: budgetInput.value });
        nameInput.value = "";
        areaInput.value = "";
        saveState();
        renderTripProjectWorkspace();
      });
    }

    const addPollBtn = byId("addPollBtn");
    if (addPollBtn) {
      addPollBtn.addEventListener("click", () => {
        const trip = getSelectedTrip();
        const questionInput = byId("pollQuestionInput");
        const optionsInput = byId("pollOptionsInput");
        if (!trip || !questionInput || !optionsInput) return;
        const question = questionInput.value.trim();
        const options = optionsInput.value.split(",").map((x) => x.trim()).filter(Boolean);
        if (!question || !options.length) return;
        ensureTripProjectArrays(trip);
        trip.polls.push({ question, options });
        questionInput.value = "";
        optionsInput.value = "";
        saveState();
        renderTripProjectWorkspace();
      });
    }

    const addInspirationBtn = byId("addInspirationBtn");
    if (addInspirationBtn) {
      addInspirationBtn.addEventListener("click", () => {
        const trip = getSelectedTrip();
        const urlInput = byId("inspirationUrlInput");
        const noteInput = byId("inspirationNoteInput");
        if (!trip || !urlInput || !noteInput) return;
        const url = urlInput.value.trim();
        const note = noteInput.value.trim();
        if (!url) return;
        ensureTripProjectArrays(trip);
        trip.inspirationLinks.push({ url, note });
        urlInput.value = "";
        noteInput.value = "";
        saveState();
        renderTripProjectWorkspace();
      });
    }

    const addSuggestionBtn = byId("addSuggestionBtn");
    if (addSuggestionBtn) {
      addSuggestionBtn.addEventListener("click", () => {
        const trip = getSelectedTrip();
        if (!trip) return;
        const titleInput = byId("suggestionTitleInput");
        const categoryInput = byId("suggestionCategorySelect");
        const byInput = byId("suggestionByInput");
        const startInputValue = byId("suggestionStartInput");
        const endInputValue = byId("suggestionEndInput");
        const openFromInput = byId("suggestionOpenFromInput");
        const openToInput = byId("suggestionOpenToInput");
        const travelInput = byId("suggestionTravelInput");
        const mustSeeInput = byId("suggestionMustSeeInput");
        if (!titleInput || !categoryInput || !byInput || !startInputValue || !endInputValue || !openFromInput || !openToInput || !travelInput || !mustSeeInput) return;

        const title = titleInput.value.trim();
        const startTime = startInputValue.value;
        const endTime = endInputValue.value;
        if (!title || !startTime || !endTime) return;

        ensureTripProjectArrays(trip);
        const suggestion = {
          id: `${trip.id}-suggestion-${Date.now()}`,
          title,
          category: categoryInput.value || "Activity",
          startTime,
          endTime,
          openFrom: openFromInput.value || "",
          openTo: openToInput.value || "",
          travelMins: Math.max(0, Number(travelInput.value) || 0),
          proposedBy: byInput.value.trim() || "george",
          mustSee: mustSeeInput.checked
        };
        trip.daySuggestions.push(suggestion);
        logTripDecision(trip, `Added suggestion: ${title}`);

        titleInput.value = "";
        byInput.value = "";
        startInputValue.value = "";
        endInputValue.value = "";
        openFromInput.value = "";
        openToInput.value = "";
        travelInput.value = "";
        mustSeeInput.checked = false;

        saveState();
        renderDayPlanAgreement();
      });
    }
  }

  function renderAll() {
    renderCalendar();
    renderPreferences();
    renderContactDetails();
    renderCommunities();
    ensureCommunitySelect();
    renderUpcoming();
    renderUpcomingPolls();
    renderTrips();
    updateTracker();
    renderTripProjectWorkspace();
    renderDayPlanAgreement();
    updateTripBuilderDetails();
  }

  const state = loadState();
  document.addEventListener("DOMContentLoaded", () => {
    if (!enforceAuth()) return;
    applyInitialSelectionFromQuery();
    initTheme();
    initNavigation();
    wireActions();
    renderAll();
    syncTripSetupWithLocation();
    initGenieWidget();
  });
})();

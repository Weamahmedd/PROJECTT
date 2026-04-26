// ========== GLOBAL CART LOGIC ==========
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cartifyCart")) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cartifyCart", JSON.stringify(cart));
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  const badges = document.querySelectorAll(".cart-badge");
  badges.forEach((badge) => {
    badge.innerText = count;
    badge.style.display = count > 0 ? "flex" : "none";
    badge.style.transition =
      "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  });
}

function showCartToast(msg) {
  let toast = document.querySelector(".wishlist-toast"); 
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "wishlist-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  toast.style.backgroundColor = "var(--primary-color)"; 
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { toast.style.backgroundColor = ""; }, 300); // reset color after hide
  }, 2200);
}

function addToCart(product) {
  let cart = getCart();
  const existing = cart.find((item) => item.name.toLowerCase() === product.name.toLowerCase());
  if (existing) {
    existing.qty += product.qty || 1;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category || "General",
      qty: product.qty || 1
    });
  }
  saveCart(cart);
  updateCartBadge();
  
  // Badge bounce
  document.querySelectorAll(".cart-badge").forEach((badge) => {
    badge.style.transform = "scale(1.5)";
    setTimeout(() => (badge.style.transform = "scale(1)"), 300);
  });
}

function removeFromCart(name) {
  let cart = getCart();
  cart = cart.filter((item) => item.name.toLowerCase() !== name.toLowerCase());
  saveCart(cart);
  updateCartBadge();
}

function updateCartItemQty(name, newQty) {
  let cart = getCart();
  const item = cart.find((i) => i.name.toLowerCase() === name.toLowerCase());
  if (item) {
    item.qty = Math.max(1, newQty);
    saveCart(cart);
    updateCartBadge();
  }
}

// Universal listener for 'Add to Cart' buttons across all pages
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".button-cartt, .btn-add-cart:not(.wishlist-add-cart-btn)");
  if (btn) {
    // If it's just the wishlist button
    if(btn.closest("#add-all-to-cart") || btn.closest(".cart-toast")) return;

    const card = btn.closest(".product-card, .product-item, .swiper-slide, .card-producct, .card-product, .rec-card, .row");
    if (!card) return;

    const titleEl = card.querySelector(".product-title, .rec-title, h5, h3, h2.fw-bold, h4.rec-title");
    const priceEl = card.querySelector(".price, .price-hot, .rec-price, h4:not(.rec-title), .display-4"); 
    
    // Attempt multiple image selectors based on page structure
    const imgEl = card.querySelector(".product-img-wrapper img, .bg-image img, .rec-img-wrapper img, #main-product-img img, img");
    
    if (!titleEl) return;
    
    const name = titleEl.textContent.trim();
    let priceText = "0.00";
    if (priceEl) {
      priceText = priceEl.textContent.trim().replace(/[^0-9.]/g, "");
    }
    const price = parseFloat(priceText) || 299.0;
    const image = imgEl ? imgEl.src : "";
    const categoryEl = card.querySelector(".text-muted");
    const category = categoryEl ? categoryEl.textContent.trim() : "Electronics";

    let quantityToAdd = 1;
    const quantityDisplay = document.getElementById("quantity");
    if (quantityDisplay && btn.classList.contains("w-100")) {
      quantityToAdd = parseInt(quantityDisplay.innerText) || 1;
    }

    addToCart({ name, price, image, category, qty: quantityToAdd });
    showCartToast(`✓ Added ${quantityToAdd}x ${name}`);
  }
});

// Update badge immediately on script load (or wait for DOM)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateCartBadge);
} else {
  updateCartBadge();
}

// ============================================

// ========== SWIPER INITIALIZATION ==========
const productSwiperEl = document.querySelector(".productSwiper");
if (productSwiperEl) {
  const productSwiper = new Swiper(".productSwiper", {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    breakpoints: {
      576: { slidesPerView: 2 },
      992: { slidesPerView: 3 },
      1200: { slidesPerView: 4 },
    },
  });
}

// ========== CATEGORY PAGES — SEARCH, SORT, & PAGINATION ==========
const customPaginationContainer = document.querySelector(".pagination-custom");
const allCategoryProducts = document.querySelectorAll(".product-item");
const productGrid = document.querySelector("#product-grid");
const sortDropdownItems = document.querySelectorAll(".sort-by .dropdown-item");
const sortBtn = document.querySelector(".sort-by .filter-btn");
// searchInput is declared below in the Navbar section, but we'll move it or reuse it.
// To avoid redeclaration, let's use a shared variable or check if it's already there.
let categorySearchInput = document.querySelector(".nav-search input");

let currentPage = 1;
const itemsPerPage = 4;
let filteredItems = Array.from(allCategoryProducts);
let currentSortMode = "Most Popular";

function updateCategoryPage() {
  if (!productGrid) return;

  // 1. Sort the currently filtered items
  sortItems(filteredItems, currentSortMode);

  // 2. Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // 3. Hide all products first
  allCategoryProducts.forEach((item) => (item.style.display = "none"));

  // 4. Show only items for current page and move them to the grid to maintain order
  filteredItems.forEach((item, index) => {
    if (index >= startIndex && index < endIndex) {
      item.style.display = "block";
      productGrid.appendChild(item); // Re-order in DOM
    }
  });

  updatePaginationUI(totalPages);
}

function sortItems(arr, mode) {
  if (mode.includes("Price: Low to High")) {
    arr.sort((a, b) => getPrice(a) - getPrice(b));
  } else if (mode.includes("Newest")) {
    arr.sort((a, b) => {
      const bNew = b.querySelector(".badge-new") ? 1 : 0;
      const aNew = a.querySelector(".badge-new") ? 1 : 0;
      return bNew - aNew;
    });
  } else if (mode.includes("Most Popular")) {
    arr.sort((a, b) => getPopularity(b) - getPopularity(a));
  }
}

function getPrice(el) {
  const p =
    el.querySelector(".price")?.innerText ||
    el.querySelector(".price-hot")?.innerText ||
    "0";
  return parseFloat(p.replace("$", "").replace(",", "")) || 0;
}

function getPopularity(el) {
  const c = el.querySelector(".rating-count")?.innerText || "(0)";
  let val = c.replace(/[(),]/g, "").toLowerCase();
  if (val.includes("k")) return parseFloat(val) * 1000;
  return parseFloat(val) || 0;
}

function updatePaginationUI(totalPages) {
  if (!customPaginationContainer) return;

  // We'll rebuild the pagination links based on totalPages
  // but keep it simple: [Prev] [1] [2] [3] ... [Next]

  let html = `<li><a href="#" class="${currentPage === 1 ? "disabled" : ""}" id="prev-page"><i class="fa-solid fa-chevron-left"></i></a></li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li><a href="#" class="${i === currentPage ? "active" : ""}" data-page="${i}">${i}</a></li>`;
  }

  html += `<li><a href="#" class="${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}" id="next-page"><i class="fa-solid fa-chevron-right"></i></a></li>`;

  customPaginationContainer.innerHTML = html;

  // Re-attach listeners because we replaced the innerHTML
  customPaginationContainer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      if (this.classList.contains("disabled")) return;

      const pageNum = parseInt(this.getAttribute("data-page"));
      if (!isNaN(pageNum)) {
        currentPage = pageNum;
      } else if (this.id === "prev-page" && currentPage > 1) {
        currentPage--;
      } else if (this.id === "next-page" && currentPage < totalPages) {
        currentPage++;
      }

      updateCategoryPage();
      if (productGrid)
        productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// Event Listeners
if (allCategoryProducts.length > 0) {
  // Sort Listeners
  sortDropdownItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      currentSortMode = this.innerText.trim();
      if (sortBtn) {
        sortBtn.innerHTML = `${currentSortMode} <i class="fa-solid fa-chevron-down ms-1" style="font-size:0.7rem"></i>`;
      }
      currentPage = 1; // Reset to first page on sort
      updateCategoryPage();
    });
  });

  // Search Listener
  if (categorySearchInput) {
    categorySearchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      filteredItems = Array.from(allCategoryProducts).filter((item) => {
        const title = item
          .querySelector(".product-title")
          .innerText.toLowerCase();
        return title.includes(query);
      });
      currentPage = 1;
      updateCategoryPage();
    });
  }

  // Pagination listeners are now handled dynamically within updatePaginationUI()
  // and re-attached whenever the pagination is rebuilt.

  // Initial run
  updateCategoryPage();
}

// ========== NAVBAR (all pages) ==========

// Navbar scroll effect
const navbar = document.querySelector(".nav-home");
if (navbar) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// Active link highlighting
const navLinks = document.querySelectorAll(".nav-linkss .nav-link");
navLinks.forEach((link) => {
  link.addEventListener("click", function () {
    navLinks.forEach((l) => l.classList.remove("active-link"));
    this.classList.add("active-link");
  });
});

// Search bar enter key
const searchInput = document.querySelector(".nav-search input");
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        console.log("Searching for:", query);
      }
    }
  });
}

// ========== HOME PAGE — HERO SECTION ==========

const leftMain = document.querySelector(".left-main");
const rightMain = document.querySelector(".right-main");

if (leftMain && rightMain) {
  window.addEventListener("load", () => {
    leftMain.style.opacity = "0";
    leftMain.style.transform = "translateX(-40px)";
    leftMain.style.transition = "all 0.8s ease";

    rightMain.style.opacity = "0";
    rightMain.style.transform = "translateX(40px)";
    rightMain.style.transition = "all 0.8s ease 0.3s";

    setTimeout(() => {
      leftMain.style.opacity = "1";
      leftMain.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      rightMain.style.opacity = "1";
      rightMain.style.transform = "translateX(0)";
    }, 300);
  });

  // "Start Shopping" button
  const startShoppingBtn = leftMain.querySelector("button:nth-of-type(1)");
  if (startShoppingBtn) {
    startShoppingBtn.addEventListener("click", () => {
      window.location.href = "./Categories.html";
    });
  }

  // "Explore Features" button
  const exploreFeaturesBtn = document.querySelector(".btn-cta-secondary");
  if (exploreFeaturesBtn) {
    exploreFeaturesBtn.addEventListener("click", () => {
      const nextSection =
        document.querySelector(".main-home").nextElementSibling;
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Parallax effect on hero image
  const rightImage = document.querySelector(".image-right img");
  if (rightImage) {
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      rightImage.style.transform = `translate(${x}px, ${y}px)`;
      rightImage.style.transition = "transform 0.1s ease";
    });
  }
}

// ========== HOME PAGE — WHY SECTION ==========

const whyCards = document.querySelectorAll(".same-why, .not-same-why");
const whyHeader = document.querySelector(".header-why");

if (whyCards.length > 0) {
  whyCards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(40px)";
    card.style.transition = "all 0.6s ease";
  });

  if (whyHeader) {
    whyHeader.style.opacity = "0";
    whyHeader.style.transform = "translateY(30px)";
    whyHeader.style.transition = "all 0.6s ease";
  }

  const whyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, index * 150);
        } else {
          entry.target.style.opacity = "0";
          entry.target.style.transform = "translateY(40px)";
        }
      });
    },
    { threshold: 0.2 },
  );

  whyCards.forEach((card) => whyObserver.observe(card));
  if (whyHeader) whyObserver.observe(whyHeader);
}

// ========== HOME PAGE — PRODUCTS SECTION ==========

const productCards = document.querySelectorAll(".card-producct");

if (productCards.length > 0) {
  const products = [
    { name: "Ultra-Bass Headphones", price: 299.0 },
    { name: "Smart Watch Series X", price: 449.0 },
    { name: "Smart Lens Camera", price: 189.0 },
    { name: "Pro Leather Sleeve", price: 89.0 },
  ];

  let cart = [];

  // Scroll animation
  productCards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(40px)";
    card.style.transition = "all 0.6s ease";
  });

  const productObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, index * 150);
        } else {
          entry.target.style.opacity = "0";
          entry.target.style.transform = "translateY(40px)";
        }
      });
    },
    { threshold: 0.2 },
  );

  productCards.forEach((card) => productObserver.observe(card));

  // Add to Cart buttons
  const cartButtons = document.querySelectorAll(".button-cartt");
  cartButtons.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      const product = products[index];
      if (product) {
        cart.push(product);

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
        btn.style.backgroundColor = "#02067e";
        btn.style.color = "white";

        setTimeout(() => {
          btn.innerHTML =
            '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';
          btn.style.backgroundColor = "";
          btn.style.color = "";
        }, 1500);

        console.log("Cart:", cart);
      }
    });
  });

  // Product heading animation
  const productHead = document.querySelector(".product-head");
  if (productHead) {
    productHead.style.opacity = "0";
    productHead.style.transform = "translateY(30px)";
    productHead.style.transition = "all 0.6s ease";

    const headObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          } else {
            entry.target.style.opacity = "0";
            entry.target.style.transform = "translateY(30px)";
          }
        });
      },
      { threshold: 0.5 },
    );

    headObserver.observe(productHead);
  }
}

// ========== HOME PAGE — RETURN SECTION ==========

const returnSection = document.querySelector(".return-home");

if (returnSection) {
  const leftReturn = document.querySelector(".left-return img");
  const rightHeadings = document.querySelectorAll(".right-return h3");
  const rightParagraph = document.querySelector(".right-return p");
  const returnBtn = document.querySelector(".right-return button");

  if (leftReturn) {
    leftReturn.style.opacity = "0";
    leftReturn.style.transform = "translateX(-50px)";
    leftReturn.style.transition = "all 0.8s ease";
  }

  rightHeadings.forEach((h) => {
    h.style.opacity = "0";
    h.style.transform = "translateX(50px)";
    h.style.transition = "all 0.6s ease";
  });

  if (rightParagraph) {
    rightParagraph.style.opacity = "0";
    rightParagraph.style.transform = "translateX(50px)";
    rightParagraph.style.transition = "all 0.6s ease 0.3s";
  }

  if (returnBtn) {
    returnBtn.style.opacity = "0";
    returnBtn.style.transform = "translateY(20px)";
    returnBtn.style.transition = "all 0.6s ease 0.8s";
  }

  const returnObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (leftReturn) {
            leftReturn.style.opacity = "1";
            leftReturn.style.transform = "translateX(0)";
          }

          rightHeadings.forEach((h, index) => {
            setTimeout(() => {
              h.style.opacity = "1";
              h.style.transform = "translateX(0)";
            }, index * 150);
          });

          if (rightParagraph) {
            rightParagraph.style.opacity = "1";
            rightParagraph.style.transform = "translateX(0)";
          }

          if (returnBtn) {
            returnBtn.style.opacity = "1";
            returnBtn.style.transform = "translateY(0)";
          }
        } else {
          if (leftReturn) {
            leftReturn.style.opacity = "0";
            leftReturn.style.transform = "translateX(-50px)";
          }

          rightHeadings.forEach((h) => {
            h.style.opacity = "0";
            h.style.transform = "translateX(50px)";
          });

          if (rightParagraph) {
            rightParagraph.style.opacity = "0";
            rightParagraph.style.transform = "translateX(50px)";
          }

          if (returnBtn) {
            returnBtn.style.opacity = "0";
            returnBtn.style.transform = "translateY(20px)";
          }
        }
      });
    },
    { threshold: 0.2 },
  );

  returnObserver.observe(returnSection);

  const findABoxBtn = document.querySelector(".find-box");
  if (findABoxBtn) {
    findABoxBtn.addEventListener("click", () => {
      window.location.href = "./maps.html";
    });
  }
}

// ========== CTA / LOG SECTION ==========

const contentLog = document.querySelector(".content-log");

if (contentLog) {
  const logHeading = contentLog.querySelector("h2");
  const logParagraph = contentLog.querySelector("p");
  const logButtons = contentLog.querySelectorAll("button");

  contentLog.style.opacity = "0";
  contentLog.style.transform = "translateY(50px)";
  contentLog.style.transition = "all 0.8s ease";

  if (logHeading) {
    logHeading.style.opacity = "0";
    logHeading.style.transform = "translateY(20px)";
    logHeading.style.transition = "all 0.6s ease 0.3s";
  }

  if (logParagraph) {
    logParagraph.style.opacity = "0";
    logParagraph.style.transform = "translateY(20px)";
    logParagraph.style.transition = "all 0.6s ease 0.5s";
  }

  logButtons.forEach((btn, index) => {
    btn.style.opacity = "0";
    btn.style.transform = "translateY(20px)";
    btn.style.transition = `all 0.6s ease ${0.6 + index * 0.15}s`;
  });

  const logObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          contentLog.style.opacity = "1";
          contentLog.style.transform = "translateY(0)";

          if (logHeading) {
            logHeading.style.opacity = "1";
            logHeading.style.transform = "translateY(0)";
          }
          if (logParagraph) {
            logParagraph.style.opacity = "1";
            logParagraph.style.transform = "translateY(0)";
          }

          logButtons.forEach((btn) => {
            btn.style.opacity = "1";
            btn.style.transform = "translateY(0)";
          });
        } else {
          contentLog.style.opacity = "0";
          contentLog.style.transform = "translateY(50px)";

          if (logHeading) {
            logHeading.style.opacity = "0";
            logHeading.style.transform = "translateY(20px)";
          }
          if (logParagraph) {
            logParagraph.style.opacity = "0";
            logParagraph.style.transform = "translateY(20px)";
          }

          logButtons.forEach((btn) => {
            btn.style.opacity = "0";
            btn.style.transform = "translateY(20px)";
          });
        }
      });
    },
    { threshold: 0.3 },
  );

  const logSection = document.querySelector(".log-home");
  if (logSection) logObserver.observe(logSection);
}

// CTA Buttons (Home page)
const createAccountBtn = document.querySelector(".button-log");
if (createAccountBtn) {
  createAccountBtn.addEventListener("click", () => {
    window.location.href = "./signup.html";
  });
}

const exploreShopBtn = document.querySelector(".log-home .button-logg");
if (exploreShopBtn && exploreShopBtn.textContent.trim() === "Explore Shop") {
  exploreShopBtn.addEventListener("click", () => {
    window.location.href = "./Categories.html";
  });
}

// ========== CATEGORIES — NEWSLETTER SUBSCRIBE ==========

// Helper: show error message below an input
function showInputError(input, message) {
  clearInputError(input);

  const errorSpan = document.createElement("span");
  errorSpan.className = "input-error-msg";
  errorSpan.textContent = message;

  // Bright red style
  errorSpan.style.cssText = `
    color: #f11b1b; 
    font-size: 14px; 
    font-weight: 700; 
    display: block; 
    margin-top: 8px;
    text-align: left;
    filter: drop-shadow(0 0 1px rgba(241, 27, 27, 0.2));
  `;

  input.style.borderColor = "#f11b1b";
  input.style.borderWidth = "2px";
  input.style.backgroundColor = "rgba(241, 27, 27, 0.03)";

  input.parentElement.appendChild(errorSpan);

  setTimeout(() => {
    clearInputError(input);
  }, 4000); // 4 seconds
}

function clearInputError(input) {
  input.style.borderColor = "";
  input.style.borderWidth = "";
  input.style.backgroundColor = "";
  const existing = input.parentElement.querySelector(".input-error-msg");
  if (existing) existing.remove();
}

const newsletterInput = document.querySelector(".newsletter-input-sep");
const joinBtn = document.querySelector(".content-log .button-logg");

if (newsletterInput && joinBtn) {
  joinBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const email = newsletterInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {
      showInputError(newsletterInput, "⚠ Please enter your email address!");
      return;
    }

    if (!emailRegex.test(email)) {
      showInputError(newsletterInput, "⚠ Invalid email! Must contain @");
      return;
    }

    // Valid email
    clearInputError(newsletterInput);
    joinBtn.textContent = "Joined ✓";
    newsletterInput.value = "";
  });

  newsletterInput.addEventListener("focus", () => {
    clearInputError(newsletterInput);
    if (joinBtn.textContent.trim() === "Joined ✓") {
      joinBtn.textContent = "Join";
    }
  });

  newsletterInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      joinBtn.click();
    }
  });
}

// ========== ELECTRONICS — FOOTER NEWSLETTER ==========

const newsletterForm = document.querySelector(".newsletter-form");
if (newsletterForm) {
  const nfInput = newsletterForm.querySelector("input");
  const nfBtn = newsletterForm.querySelector("button");

  if (nfInput) nfInput.removeAttribute("required");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = nfInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {
      showInputError(nfInput, "⚠ Please enter your email address!");
      return;
    }

    if (!emailRegex.test(email)) {
      showInputError(nfInput, "⚠ Invalid email! Must contain @");
      return;
    }

    // Valid email
    clearInputError(nfInput);
    nfBtn.textContent = "Joined ✓";
    nfInput.value = "";
  });

  if (nfInput) {
    nfInput.addEventListener("focus", () => {
      clearInputError(nfInput);
      if (nfBtn.textContent.trim() === "Joined ✓") {
        nfBtn.textContent = "Join";
      }
    });
  }
}

// ========== FOOTER — NEWSLETTER ==========

const emailInput = document.querySelector(".email-box input");
const sendIcon = document.querySelector(".send-icon");

if (emailInput && sendIcon) {
  sendIcon.style.pointerEvents = "all";
  sendIcon.style.cursor = "pointer";

  sendIcon.addEventListener("click", () => {
    const email = emailInput.value.trim();

    if (email === "") {
      emailInput.style.border = "2px solid red";
      emailInput.placeholder = "Please enter your email!";
      setTimeout(() => {
        emailInput.style.border = "";
        emailInput.placeholder = "Email address";
      }, 2000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailInput.style.border = "2px solid red";
      emailInput.value = "";
      emailInput.placeholder = "Invalid email!";
      setTimeout(() => {
        emailInput.style.border = "";
        emailInput.placeholder = "Email address";
      }, 2000);
      return;
    }

    // Success
    emailInput.style.border = "2px solid #4caf50";
    emailInput.value = "";
    emailInput.placeholder = "Subscribed successfully! ✓";
    sendIcon.style.color = "#4caf50";
    setTimeout(() => {
      emailInput.style.border = "";
      emailInput.placeholder = "Email address";
      sendIcon.style.color = "";
    }, 3000);
  });

  emailInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendIcon.click();
  });
}

// Social icons hover effect
const socialLinks = document.querySelectorAll(".social-icons a");
socialLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => {
    link.style.backgroundColor = "#02067e";
    link.style.color = "white";
    link.style.transform = "translateY(-3px)";
    link.style.transition = "all 0.3s ease";
  });
  link.addEventListener("mouseleave", () => {
    link.style.backgroundColor = "";
    link.style.color = "";
    link.style.transform = "";
  });
});

// ========== WISHLIST SYSTEM (localStorage) ==========

// --- Helpers ---
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem("cartifyWishlist")) || [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem("cartifyWishlist", JSON.stringify(list));
}

function isInWishlist(name) {
  return getWishlist().some(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
}

function addToWishlist(product) {
  const list = getWishlist();
  if (!list.some((item) => item.name.toLowerCase() === product.name.toLowerCase())) {
    list.push(product);
    saveWishlist(list);
  }
  updateWishlistBadge();
}

function removeFromWishlist(name) {
  let list = getWishlist();
  list = list.filter(
    (item) => item.name.toLowerCase() !== name.toLowerCase(),
  );
  saveWishlist(list);
  updateWishlistBadge();
}

function updateWishlistBadge() {
  const count = getWishlist().length;
  document.querySelectorAll(".wishlist-badge").forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  });
  // Update the wishlist page count text if present
  const countText = document.getElementById("wishlist-count-text");
  if (countText) {
    countText.textContent = count + (count === 1 ? " item" : " items");
  }
}

function showWishlistToast(msg) {
  let toast = document.querySelector(".wishlist-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "wishlist-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// --- Auto-inject wishlist heart buttons into every product ---
function injectWishlistButtons() {
  // 1. Category product cards (.product-img-wrapper inside .product-card)
  document
    .querySelectorAll(".product-card .product-img-wrapper")
    .forEach((wrapper) => {
      if (wrapper.querySelector(".btn-wishlist")) return; // already has one
      const btn = document.createElement("button");
      btn.className = "btn-wishlist";
      btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      wrapper.appendChild(btn);
    });

  // 2. Home page swiper cards (.card-producct or .card-product)
  document
    .querySelectorAll(".card-producct, .card-product")
    .forEach((card) => {
      if (card.querySelector(".btn-wishlist")) return;
      const imgWrapper = card.querySelector(".bg-image");
      if (!imgWrapper) return;
      // Make bg-image relative for absolute positioning
      imgWrapper.style.position = "relative";
      const btn = document.createElement("button");
      btn.className = "btn-wishlist";
      btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      imgWrapper.appendChild(btn);
    });

  // 3. Recommended section cards (.rec-card)
  document.querySelectorAll(".rec-card").forEach((card) => {
    if (card.querySelector(".btn-wishlist")) return;
    const imgWrapper = card.querySelector(".rec-img-wrapper");
    if (!imgWrapper) return;
    imgWrapper.style.position = "relative";
    const btn = document.createElement("button");
    btn.className = "btn-wishlist";
    btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    imgWrapper.appendChild(btn);
  });
}

// --- Sync heart button state from localStorage ---
function syncWishlistButtons() {
  document.querySelectorAll(".btn-wishlist, .cardswhishlist").forEach((btn) => {
    const card = btn.closest(
      ".product-card, .product-item, .swiper-slide, .card-producct, .card-product, .rec-card",
    );
    if (!card) return;
    const titleEl =
      card.querySelector(".product-title") ||
      card.querySelector(".rec-title") ||
      card.querySelector("h5") ||
      card.querySelector("h3") ||
      card.querySelector("h4.rec-title");
    if (!titleEl) return;
    const name = titleEl.textContent.trim();
    const icon = btn.querySelector("i, svg");
    if (!icon) return;
    if (isInWishlist(name)) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      icon.style.color = "#ef4444";
      btn.classList.add("active-wish");
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      icon.style.color = "";
      btn.classList.remove("active-wish");
    }
  });
}

// --- Event delegation for ALL wishlist heart buttons (existing + injected) ---
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-wishlist, .cardswhishlist");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const card = btn.closest(
    ".product-card, .product-item, .swiper-slide, .card-producct, .card-product, .rec-card",
  );
  if (!card) return;

  const titleEl =
    card.querySelector(".product-title") ||
    card.querySelector(".rec-title") ||
    card.querySelector("h5") ||
    card.querySelector("h3") ||
    card.querySelector("h4.rec-title");
  const priceEl =
    card.querySelector(".price") ||
    card.querySelector(".price-hot") ||
    card.querySelector(".rec-price") ||
    card.querySelector("h4:not(.rec-title)");
  const imgEl =
    card.querySelector(".product-img-wrapper img") ||
    card.querySelector(".bg-image img") ||
    card.querySelector(".rec-img-wrapper img") ||
    card.querySelector("img");

  if (!titleEl) return;

  const name = titleEl.textContent.trim();
  const price = priceEl ? priceEl.textContent.trim() : "$0.00";
  const image = imgEl ? imgEl.src : "";

  // Count stars
  let starCount = 0;
  const stars = card.querySelectorAll(
    ".rating .fa-star, .fa-solid.fa-star",
  );
  starCount = stars.length;
  const halfStar = card.querySelector(".fa-star-half-stroke");
  const rating = halfStar ? starCount + 0.5 : starCount || 4.5;

  const icon = btn.querySelector("i, svg");

  if (isInWishlist(name)) {
    removeFromWishlist(name);
    btn.classList.remove("active-wish");
    if (icon) {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      icon.style.color = "";
    }
    showWishlistToast("✕ Removed from wishlist");
  } else {
    addToWishlist({ name, price, image, rating: rating.toString() });
    btn.classList.add("active-wish");
    if (icon) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      icon.style.color = "#ef4444";
    }
    showWishlistToast("♥ Added to wishlist");
  }
});

// --- Wishlist Page Rendering ---
function renderWishlistPage() {
  const grid = document.getElementById("wishlist-grid");
  const emptyState = document.getElementById("wishlist-empty");
  const heroSection = document.querySelector(".wishlist-hero");
  if (!grid) return; // Not on wishlist page

  const items = getWishlist();
  updateWishlistBadge();

  if (items.length === 0) {
    grid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    if (heroSection) {
      const actions = heroSection.querySelector(".wishlist-actions");
      if (actions) actions.style.display = "none";
    }
    return;
  }

  grid.style.display = "";
  if (emptyState) emptyState.style.display = "none";
  if (heroSection) {
    const actions = heroSection.querySelector(".wishlist-actions");
    if (actions) actions.style.display = "flex";
  }

  grid.innerHTML = "";

  items.forEach((item, index) => {
    const col = document.createElement("div");
    col.className = "col";
    col.style.animationDelay = index * 0.08 + "s";

    // Generate star HTML
    const ratingNum = parseFloat(item.rating) || 4.5;
    const fullStars = Math.floor(ratingNum);
    const hasHalf = ratingNum % 1 >= 0.5;
    let starsHTML = "";
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fa-solid fa-star"></i>';
    }
    if (hasHalf) {
      starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
    }

    col.innerHTML = `
      <div class="wishlist-card">
        <div class="wishlist-card-img">
          <button class="wishlist-remove-btn" data-name="${item.name.replace(/"/g, "&quot;")}" title="Remove">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="wishlist-card-body">
          <div class="wishlist-card-rating">
            <span class="stars">${starsHTML}</span>
            <span class="rating-val">${ratingNum}</span>
          </div>
          <h3 class="wishlist-card-title">${item.name}</h3>
          <div class="wishlist-card-price">${item.price}</div>
          <button class="wishlist-add-cart-btn" data-name="${item.name.replace(/"/g, "&quot;")}">
            <i class="fa-solid fa-cart-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });

  // Remove buttons
  grid.querySelectorAll(".wishlist-remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const name = this.getAttribute("data-name");
      const cardCol = this.closest(".col");
      const card = cardCol.querySelector(".wishlist-card");
      card.classList.add("wishlist-card-removing");
      setTimeout(() => {
        removeFromWishlist(name);
        renderWishlistPage();
        showWishlistToast("✕ Removed from wishlist");
      }, 350);
    });
  });

  // Add-to-cart buttons inside wishlist
  grid.querySelectorAll(".wishlist-add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".wishlist-card");
      if(!card) return;
      const name = card.querySelector(".wishlist-card-title").textContent.trim();
      const priceText = card.querySelector(".wishlist-card-price").textContent.replace(/[^0-9.]/g, "");
      const price = parseFloat(priceText) || 0;
      const image = card.querySelector("img").src;
      const category = "Wishlist Item";
      
      addToCart({ name, price, image, category, qty: 1 });
      
      this.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
      this.classList.add("added");
      setTimeout(() => {
        this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';
        this.classList.remove("added");
      }, 1500);
    });
  });
}

// Clear All button
const clearAllBtn = document.getElementById("clear-all-wishlist");
if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    if (getWishlist().length === 0) return;
    saveWishlist([]);
    updateWishlistBadge();
    renderWishlistPage();
    showWishlistToast("Wishlist cleared");
  });
}

// Add All to Cart button
const addAllBtn = document.getElementById("add-all-to-cart");
if (addAllBtn) {
  addAllBtn.addEventListener("click", () => {
    const items = getWishlist();
    if (items.length === 0) return;
    
    items.forEach(item => {
       const priceText = item.price.replace(/[^0-9.]/g, "");
       addToCart({
          name: item.name,
          price: parseFloat(priceText) || 0,
          image: item.image,
          category: "Wishlist Item",
          qty: 1
       });
    });

    showCartToast(
      "✓ Added " + items.length + " item" + (items.length > 1 ? "s" : "") + " to cart",
    );
  });
}

// Initial: inject buttons → sync state → render wishlist page
injectWishlistButtons();
updateWishlistBadge();
syncWishlistButtons();
renderWishlistPage();

// Electronics — Add to Cart buttons
const addCartButtons = document.querySelectorAll(".btn-add-cart");
addCartButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const icon = btn.querySelector("i");
    btn.style.backgroundColor = "#4caf50";
    icon.classList.remove("fa-cart-arrow-down");
    icon.classList.add("fa-check");

    setTimeout(() => {
      btn.style.backgroundColor = "";
      icon.classList.remove("fa-check");
      icon.classList.add("fa-cart-arrow-down");
    }, 1500);
  });
});
// ========== PRODUCT DETAIL PAGE LOGIC ==========
const MainProductImg = document.getElementById("product-img");
const smallImg = document.getElementsByClassName("small-img");

if (MainProductImg && smallImg.length > 0) {
  MainProductImg.src = smallImg[0].src;
  for (let i = 0; i < smallImg.length; i++) {
    smallImg[i].onclick = function () {
      MainProductImg.src = smallImg[i].src;
      for (let j = 0; j < smallImg.length; j++) {
        smallImg[j].classList.remove("active");
      }
      smallImg[i].classList.add("active");
    };
  }
}

const decreaseBtn = document.getElementById("decrease");
const increaseBtn = document.getElementById("increase");
const quantitySpan = document.getElementById("quantity");

if (decreaseBtn && increaseBtn && quantitySpan) {
  let currentQty = parseInt(quantitySpan.textContent) || 1;
  decreaseBtn.addEventListener("click", () => {
    if (currentQty > 1) {
      currentQty--;
      quantitySpan.textContent = currentQty;
    }
  });
  increaseBtn.addEventListener("click", () => {
    currentQty++;
    quantitySpan.textContent = currentQty;
  });
}

// ========== profile PAGE ==========

function convertDollar() {
  var dollar = document.getElementById("dollar").value;
  var result = document.getElementById("result");
  if (dollar == "") {
    result.innerHTML = "Enter Data";
    return false;
  } else if (isNaN(dollar)) {
    result.innerHTML = "Enter Number Not Text";
    return false;
  } else if (dollar < 0) {
    result.innerHTML = "Enter postive Number";
    return false;
  } else if (dollar == 0) {
    result.innerHTML = "Enter Number Rather than 0";
    return false;
  } else {
    result.innerHTML = dollar * 55 + "Egyptian pound";
    return false;
  }
}

// start validate function

function validation() {
  var user = document.getElementById("fullname").value;

  var email = document.getElementById("email").value;

  var pass = document.getElementById("password").value;

  var confirm = document.getElementById("confirm-password").value;

  var result = document.getElementById("result");

  result.setAttribute(
    "class",
    "alert alert-danger text-center form-control rounded-pill py-1 px-3 small fw-bold ",
  );

  if (user == "" && email == "" && pass == "" && confirm == "") {
    result.innerHTML = "please Insert Valid Data";
    return false;
  } else if (user.length < 5 || user.length > 15) {
    result.innerHTML = "please Insert 5-15 character in user";
    return false;
  } else if (email.indexOf("@") == -1 || email.indexOf(".com") == -1) {
    result.innerHTML = "Please Enter Valid Email";
    return false;
  } else if (pass.length < 8) {
    result.innerHTML = "please Insert atleast 8 character in pass";
    return false;
  } else if (pass != confirm) {
    result.innerHTML = "please Matched pass";
    return false;
  } else {
    return true;
  }
}

// end validate function
// Selection functionality
function selectItem(element) {
  document
    .querySelectorAll(".item-card")
    .forEach((c) => c.classList.remove("selected"));
  element.classList.add("selected");
}

function selectReason(element) {
  document
    .querySelectorAll(".reason-chip")
    .forEach((c) => c.classList.remove("active"));
  element.classList.add("active");
}
//RETURN PAGE
// Navigation toggle
function generateCode() {
  document.getElementById("request-view").style.display = "none";
  document.getElementById("success-view").style.display = "block";
  window.scrollTo(0, 0);
}
//END RETURN PAGE
// Make Categories active for main + all cat-pages
(function () {
  let currentNavPage =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");

    let pageType = link.dataset.page;

    if (pageType === "home" && currentNavPage === "index.html") {
      link.classList.add("active");
    } else if (pageType === "returns" && currentNavPage === "returns.html") {
      link.classList.add("active");
    } else if (
      pageType === "categories" &&
      (currentNavPage === "Categories.html" ||
        currentNavPage.toLowerCase().includes("cat-") ||
        currentNavPage.toLowerCase().includes("categories"))
    ) {
      link.classList.add("active");
    }
  });
})();

// --- Cart Page Rendering ---
function renderCartPage() {
  const container = document.getElementById("cart-items-container");
  const emptyState = document.getElementById("cart-empty-state");
  const summarySection = document.getElementById("cart-summary-section");
  const actionsBottom = document.getElementById("cart-actions-bottom");
  const leftCol = document.getElementById("cart-left-column");
  
  if (!container) return; // not on cart page

  const cart = getCart();

  if (cart.length === 0) {
    if (leftCol) leftCol.className = "col-12";
    container.innerHTML = "";
    emptyState.style.display = "block";
    summarySection.style.display = "none";
    actionsBottom.style.setProperty("display", "none", "important");
    return;
  }

  if (leftCol) leftCol.className = "col-lg-7 col-xl-8";
  emptyState.style.display = "none";
  summarySection.style.display = "block";
  actionsBottom.style.setProperty("display", "flex", "important");

  container.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item) => {
    subtotal += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item-card";
    
    // Background color trick based on category for aesthetics, default fallback
    let bgColor = "#cbd5e1"; 
    const lowerName = item.name.toLowerCase();
    const lowerCat = item.category.toLowerCase();
    
    if (lowerCat.includes("audio") || lowerName.includes("headphone") || lowerName.includes("pods")) bgColor = "#fcd34d";
    else if (lowerCat.includes("wearables") || lowerCat.includes("watch")) bgColor = "#e2e8f0";
    else if (lowerCat.includes("phone")) bgColor = "#f8e5cc";
    else if (lowerCat.includes("camera")) bgColor = "#f7e6dc";
    else if (lowerCat.includes("fashion") || lowerCat.includes("beauty")) bgColor = "#fecdd3";
    else if (lowerCat.includes("living") || lowerCat.includes("furniture")) bgColor = "#bbf7d0";
    else if (lowerCat.includes("school")) bgColor = "#bfdbfe";

    div.innerHTML = `
      <div class="cart-img-wrapper" style="background-color: ${bgColor}">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      
      <div class="cart-item-details flex-grow-1">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-subtitle">${item.category}</div>
        
        <div class="qty-delete-wrapper d-flex align-items-center mt-2">
          <div class="qty-control shadow-sm">
            <button class="qty-btn qty-minus" data-name="${item.name}">
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn qty-plus" data-name="${item.name}">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          
          <button class="cart-item-delete" data-name="${item.name}" title="Remove Item">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
      
      <div class="cart-item-price align-self-center">$${(item.price * item.qty).toFixed(2)}</div>
    `;

    container.appendChild(div);
  });

  // Calculate and update summary
  document.getElementById("summary-subtotal").textContent = "$" + subtotal.toFixed(2);
  document.getElementById("summary-total").textContent = "$" + subtotal.toFixed(2);

  // Bind Events
  container.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", function() {
      const name = this.getAttribute("data-name");
      const item = cart.find(i => i.name === name);
      if(item && item.qty > 1) {
        updateCartItemQty(name, item.qty - 1);
        renderCartPage();
      }
    });
  });

  container.querySelectorAll(".qty-plus").forEach((btn) => {
    btn.addEventListener("click", function() {
      const name = this.getAttribute("data-name");
      const item = cart.find(i => i.name === name);
      if(item) {
        updateCartItemQty(name, item.qty + 1);
        renderCartPage();
      }
    });
  });

  container.querySelectorAll(".cart-item-delete").forEach((btn) => {
    btn.addEventListener("click", function() {
      const name = this.getAttribute("data-name");
      const card = this.closest(".cart-item-card");
      card.classList.add("cart-item-removing");
      
      setTimeout(() => {
        removeFromCart(name);
        renderCartPage();
      }, 400); // Wait for animation
    });
  });
}

// Ensure it runs perfectly after load
renderCartPage();



// --- Checkout Page Rendering & Logic ---
function renderCheckoutPage() {
  const checkoutList = document.getElementById("checkout-items-list");
  if (!checkoutList) return;
  const cart = getCart();
  checkoutList.innerHTML = "";
  let subtotal = 0;
  if (cart.length === 0) {
    checkoutList.innerHTML = "<p class='text-muted text-center py-3'>Your cart is empty.</p>";
    document.getElementById("checkout-subtotal").textContent = "$0.00";
    document.getElementById("checkout-tax").textContent = "$0.00";
    document.getElementById("checkout-total").textContent = "$0.00";
    return;
  }
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
    let bgColor = "#cbd5e1";
    const lowerName = item.name.toLowerCase();
    const lowerCat = item.category.toLowerCase();
    if (lowerCat.includes("audio") || lowerName.includes("headphone") || lowerName.includes("pods")) bgColor = "#fcd34d";
    else if (lowerCat.includes("wearables") || lowerCat.includes("watch")) bgColor = "#e2e8f0";
    else if (lowerCat.includes("phone")) bgColor = "#f8e5cc";
    else if (lowerCat.includes("camera")) bgColor = "#f7e6dc";
    else if (lowerCat.includes("fashion") || lowerCat.includes("beauty")) bgColor = "#fecdd3";
    else if (lowerCat.includes("living") || lowerCat.includes("furniture")) bgColor = "#bbf7d0";
    else if (lowerCat.includes("school")) bgColor = "#bfdbfe";
    const div = document.createElement("div");
    div.className = "checkout-item-card position-relative";
    div.innerHTML = `
      <div class="checkout-item-img shadow-sm" style="background-color: ${bgColor}">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="checkout-item-info">
        <div class="checkout-item-title">${item.name}</div>
        <div class="checkout-item-category">${item.category}</div>
        <div class="checkout-item-qty">QTY: ${String(item.qty).padStart(2, '0')}</div>
      </div>
      <div class="checkout-item-price">$${(item.price * item.qty).toFixed(2)}</div>
    `;
    checkoutList.appendChild(div);
  });
  const tax = subtotal * 0.015;
  const total = subtotal + tax;
  document.getElementById("checkout-subtotal").textContent = "$" + subtotal.toFixed(2);
  document.getElementById("checkout-tax").textContent = "$" + tax.toFixed(2);
  document.getElementById("checkout-total").textContent = "$" + total.toFixed(2);
  const paymentCards = document.querySelectorAll(".payment-method-card");
  const cardDetailsBox = document.getElementById("card-details-box");
  paymentCards.forEach((card) => {
    card.addEventListener("click", () => {
      paymentCards.forEach(c => c.classList.remove("active"));
      paymentCards.forEach(c => c.style.opacity = "0.7");
      paymentCards.forEach(c => { 
        const dot = c.querySelector(".fa-circle-dot, .fa-circle"); 
        if(dot) { 
          dot.classList.remove("fa-circle-dot", "fa-solid"); 
          dot.classList.add("fa-circle", "fa-regular"); 
          dot.style.color = ""; // let css handle color
        } 
      });
      card.classList.add("active");
      card.style.opacity = "1";
      const dot = card.querySelector(".fa-circle");
      if(dot) { 
        dot.classList.remove("fa-circle", "fa-regular"); 
        dot.classList.add("fa-circle-dot", "fa-solid"); 
        // We removed manual color, let CSS handle active color
      }
      const radio = card.querySelector("input[type='radio']");
      const cardInputs = cardDetailsBox ? cardDetailsBox.querySelectorAll("input") : [];
      if (radio && radio.value === "cash") { 
          if(cardDetailsBox) cardDetailsBox.style.display = "none";
          cardInputs.forEach(i => i.required = false);
      } else { 
          if(cardDetailsBox) cardDetailsBox.style.display = "block";
          cardInputs.forEach(i => i.required = true);
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", renderCheckoutPage);

// --- Place Order Logic ---
const placeOrderBtn = document.getElementById("place-order-btn");
if(placeOrderBtn) {
  placeOrderBtn.addEventListener("click", function() {
    const cart = getCart();
    if(cart.length === 0) return;

    // Validation Check
    const form = document.getElementById("checkout-form");
    if(form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Save order details for tracking page before clearing
    const orderData = {
        orderId: "SS-" + Math.floor(10000 + Math.random() * 90000),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: cart,
        total: document.getElementById("checkout-total").textContent
    };
    localStorage.setItem("cartifyLastOrder", JSON.stringify(orderData));

    const overlay = document.getElementById("order-success-overlay");
    if(overlay) {
      overlay.classList.remove("d-none");
      document.body.style.overflow = "hidden";
      
      let subtotal = 0;
      cart.forEach(i => subtotal += i.price * i.qty);
      const tax = subtotal * 0.015;
      const total = subtotal + tax;
      
      document.getElementById("success-total").textContent = "$" + total.toFixed(2);
      document.getElementById("success-items-count").textContent = "(" + cart.length + " Items)";
      
      const miniImages = document.getElementById("success-mini-images");
      if(miniImages) {
        miniImages.innerHTML = "";
        cart.slice(0, 3).forEach(i => {
          const imgDiv = document.createElement("div");
          imgDiv.className = "rounded-circle shadow-sm overflow-hidden d-flex align-items-center justify-content-center border";
          imgDiv.style.width = "24px"; imgDiv.style.height = "24px"; imgDiv.style.backgroundColor = "#fff";
          imgDiv.innerHTML = `<img src="${i.image}" style="width: 90%; height: 90%; object-fit: contain;">`;
          miniImages.appendChild(imgDiv);
        });
        if(cart.length > 3) {
          const extra = document.createElement("div");
          extra.className = "rounded-circle shadow-sm d-flex align-items-center justify-content-center bg-light text-muted border";
          extra.style.width = "24px"; extra.style.height = "24px"; extra.style.fontSize = "0.5rem"; extra.style.fontWeight = "bold";
          extra.textContent = "+" + (cart.length - 3);
          miniImages.appendChild(extra);
        }
      }
      
      // Clear cart
      localStorage.removeItem("cartifyCart");
      updateCartCounts();
    }
  });
}

















// --- Order history Page ---

function filterOrders(status, event) {
    const orders = document.querySelectorAll('.order-card');
    const buttons = document.querySelectorAll('.filters button');

    // Button active state
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    let delay = 0;

    orders.forEach(order => {
        const orderStatus = order.dataset.status;

        // Hide first (animation out)
        order.classList.remove('show');
        order.classList.add('hide');

        setTimeout(() => {
            if (status === 'all' || orderStatus === status) {
                order.style.display = 'flex';

                // Reset animation
                order.classList.remove('hide');

                setTimeout(() => {
                    order.classList.add('show');
                }, 50);

            } else {
                order.style.display = 'none';
            }
        }, delay);

        delay += 100; // stagger effect 
    });
}

// pagination 
function initOrderHistory() {
    const itemsPerPage = 4;
    const items = document.querySelectorAll('.order-card'); // Fixed from .order-item to match HTML
    const pagination = document.getElementById('pagination');

    if (!pagination) return; // Prevent crashes on other pages

    let currentPage = 1;

    function showPage(page) {
        currentPage = page;

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        items.forEach((item, index) => {
            // Respect the active filter: if it was hidden by filter, we might need complex logic.
            // But for simple pagination, we just toggle display.
            item.style.display = (index >= start && index < end) ? "flex" : "none";
        });

        renderPagination();
    }

    function renderPagination() {
        const pageCount = Math.ceil(items.length / itemsPerPage);
        pagination.innerHTML = "";
        
        if(pageCount <= 1) return;

        // PREV BUTTON
        const prev = document.createElement("li");
        prev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
        prev.innerHTML = `<a class="page-link" href="#">‹</a>`;
        prev.onclick = (e) => {
            e.preventDefault();
            if (currentPage > 1) showPage(currentPage - 1);
        };
        pagination.appendChild(prev);

        // PAGE NUMBERS
        for (let i = 1; i <= pageCount; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === currentPage ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = (e) => {
                e.preventDefault();
                showPage(i);
            };
            pagination.appendChild(li);
        }

        // NEXT BUTTON
        const next = document.createElement("li");
        next.className = `page-item ${currentPage === pageCount ? "disabled" : ""}`;
        next.innerHTML = `<a class="page-link" href="#">›</a>`;
        next.onclick = (e) => {
            e.preventDefault();
            if (currentPage < pageCount) showPage(currentPage + 1);
        };
        pagination.appendChild(next);
    }

    // INIT
    showPage(1);
}

document.addEventListener("DOMContentLoaded", initOrderHistory);




// --- Order Tracking Page Logic ---
function initTrackPage() {
    const trackDetails = document.getElementById("track-order-details");
    if (!trackDetails) return;

    const lastOrder = JSON.parse(localStorage.getItem("cartifyLastOrder"));
    if (!lastOrder) {
        document.querySelector(".track-main-card").innerHTML = `
            <div class="text-center py-5">
                <i class="fa-solid fa-box-open fa-3x text-light mb-3"></i>
                <h4 class="text-muted">No active order to track.</h4>
                <a href="./Categories.html" class="btn btn-primary rounded-pill mt-3">Start Shopping</a>
            </div>
        `;
        return;
    }

    // Populate Order Info
    trackDetails.textContent = `Order #${lastOrder.orderId} • Placed ${lastOrder.date}`;
    
    // Use the first item for the main product card
    if (lastOrder.items && lastOrder.items.length > 0) {
        const firstItem = lastOrder.items[0];
        document.getElementById("track-product-img").src = firstItem.image;
        document.getElementById("track-product-name").textContent = firstItem.name;
        document.getElementById("track-product-price").textContent = "$" + (parseFloat(firstItem.price) * firstItem.qty).toFixed(2);
        
        // Dynamic dates
        const orderDate = new Date(lastOrder.date);
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(orderDate.getDate() + 4);
        const processingDate = new Date(orderDate);
        processingDate.setDate(orderDate.getDate() + 1);

        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        document.getElementById("track-delivery-date").textContent = deliveryDate.toLocaleDateString('en-US', options);
        document.getElementById("track-placed-date").textContent = lastOrder.date + " - 09:42 AM";
        document.getElementById("track-processing-date").textContent = "Estimated " + processingDate.toLocaleDateString('en-US', options);
    }
}

document.addEventListener("DOMContentLoaded", initTrackPage);

// Smooth scroll to hash on load
window.addEventListener("load", () => {
  if (window.location.hash) {
    const element = document.querySelector(window.location.hash);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }
});


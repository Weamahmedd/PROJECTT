// ========== GLOBAL CART LOGIC ==========
let cartCount = parseInt(sessionStorage.getItem('cartCount')) || 0;

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.innerText = cartCount;
        badge.style.display = cartCount > 0 ? 'flex' : 'none';
        badge.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
}

// Universal listener for 'Add to Cart' buttons across all pages
document.addEventListener('click', (e) => {
    // Check for both .button-cartt (Home) and .btn-add-cart (Categories/Product)
    const btn = e.target.closest('.button-cartt, .btn-add-cart');
    if (btn) {
        // Handle quantity if on a product details page
        let quantityToAdd = 1;
        const quantityDisplay = document.getElementById("quantity");
        if (quantityDisplay && btn.classList.contains("w-100")) {
            quantityToAdd = parseInt(quantityDisplay.innerText) || 1;
        }

        cartCount += quantityToAdd;
        sessionStorage.setItem('cartCount', cartCount);
        updateCartBadge();
        
        // Brief scale-up animation feedback
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.style.transform = 'scale(1.5)';
            setTimeout(() => badge.style.transform = 'scale(1)', 300);
        });
    }
});

// Update badge immediately on script load (or wait for DOM)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadge);
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
    allCategoryProducts.forEach(item => item.style.display = "none");

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
            const bNew = b.querySelector('.badge-new') ? 1 : 0;
            const aNew = a.querySelector('.badge-new') ? 1 : 0;
            return bNew - aNew;
        });
    } else if (mode.includes("Most Popular")) {
        arr.sort((a, b) => getPopularity(b) - getPopularity(a));
    }
}

function getPrice(el) {
    const p = el.querySelector('.price')?.innerText || el.querySelector('.price-hot')?.innerText || "0";
    return parseFloat(p.replace('$', '').replace(',', '')) || 0;
}

function getPopularity(el) {
    const c = el.querySelector('.rating-count')?.innerText || "(0)";
    let val = c.replace(/[(),]/g, '').toLowerCase();
    if (val.includes('k')) return parseFloat(val) * 1000;
    return parseFloat(val) || 0;
}

function updatePaginationUI(totalPages) {
    if (!customPaginationContainer) return;
    
    // We'll rebuild the pagination links based on totalPages
    // but keep it simple: [Prev] [1] [2] [3] ... [Next]
    
    let html = `<li><a href="#" class="${currentPage === 1 ? 'disabled' : ''}" id="prev-page"><i class="fa-solid fa-chevron-left"></i></a></li>`;
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<li><a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a></li>`;
    }
    
    html += `<li><a href="#" class="${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}" id="next-page"><i class="fa-solid fa-chevron-right"></i></a></li>`;
    
    customPaginationContainer.innerHTML = html;

    // Re-attach listeners because we replaced the innerHTML
    customPaginationContainer.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            if (this.classList.contains('disabled')) return;

            const pageNum = parseInt(this.getAttribute('data-page'));
            if (!isNaN(pageNum)) {
                currentPage = pageNum;
            } else if (this.id === "prev-page" && currentPage > 1) {
                currentPage--;
            } else if (this.id === "next-page" && currentPage < totalPages) {
                currentPage++;
            }
            
            updateCategoryPage();
            if (productGrid) productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

// Event Listeners
if (allCategoryProducts.length > 0) {
    // Sort Listeners
    sortDropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
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
        categorySearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            filteredItems = Array.from(allCategoryProducts).filter(item => {
                const title = item.querySelector('.product-title').innerText.toLowerCase();
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

// ========== ELECTRONICS PAGE — WISHLIST TOGGLE ==========

const wishlistButtons = document.querySelectorAll(".btn-wishlist");
wishlistButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const icon = btn.querySelector("i");
    if (icon.classList.contains("fa-regular")) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      icon.style.color = "#ef4444";
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      icon.style.color = "";
    }
  });
});

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

function convertDollar(){
    var dollar = document.getElementById("dollar").value;
    var result = document.getElementById("result");
    if(dollar==""){
        result.innerHTML="Enter Data";
        return false;
    }else if(isNaN(dollar)){
        result.innerHTML="Enter Number Not Text";
        return false;
    }else if (dollar<0){
        result.innerHTML="Enter postive Number";
        return false;
    }else if(dollar==0){
        result.innerHTML="Enter Number Rather than 0"
        return false;
    }else{
result.innerHTML=dollar*55+"Egyptian pound";
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

 result.setAttribute("class","alert alert-danger text-center form-control rounded-pill py-1 px-3 small fw-bold ")


  if (user == "" && email == "" && pass == "" && confirm == "") {
    result.innerHTML = "please Insert Valid Data";
    return false;
  } else if (user.length < 5 || user.length > 15) {
    result.innerHTML = "please Insert 5-15 character in user";
    return false;
  } else if (email.indexOf("@") == -1 || email.indexOf(".com") ==-1) {
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

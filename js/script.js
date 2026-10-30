document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const mainNavigation = document.getElementById("main-navigation");

    if (menuToggle && mainNavigation) {
        const closeMenu = () => {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        };

        menuToggle.addEventListener("click", () => {
            const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isExpanded));
            menuToggle.setAttribute(
                "aria-label",
                isExpanded ? "Open navigation menu" : "Close navigation menu"
            );
        });

        mainNavigation.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
                closeMenu();
                menuToggle.focus();
            }
        });

        window.matchMedia("(min-width: 601px)").addEventListener("change", closeMenu);
    }

    const today = new Date();
    const localDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const setFieldError = (field, message) => {
        const error = document.getElementById(`${field.id}-error`);
        field.setAttribute("aria-invalid", message ? "true" : "false");
        if (error) {
            error.textContent = message;
        }
    };

    const setFormFeedback = (form) => {
        const status = form.querySelector(".form-status");

        form.addEventListener("invalid", (event) => {
            const field = event.target;
            setFieldError(field, field.validationMessage);
            status.textContent = `Please correct the highlighted field: ${field.validationMessage}`;
        }, true);

        form.querySelectorAll("input, select, textarea").forEach((field) => {
            field.addEventListener("input", () => {
                field.setCustomValidity("");
                if (field.validity.valid) {
                    setFieldError(field, "");
                }
                if (!form.querySelector(".field-error:not(:empty)")) {
                    status.textContent = "";
                }
            });
            field.addEventListener("change", () => {
                if (field.validity.valid) {
                    setFieldError(field, "");
                }
            });
        });

        return status;
    };

    const isValidPhone = (value) => {
        const normalized = value.trim().replace(/[\s().-]/g, "");
        return /^\+?\d{7,15}$/.test(normalized);
    };

    const validateText = (field, minimumLength, message) => {
        if (field.value.trim().length < minimumLength) {
            field.setCustomValidity(message);
            field.reportValidity();
            return false;
        }
        field.setCustomValidity("");
        return true;
    };

    const clearFieldFeedback = (form) => {
        form.querySelectorAll("input, select, textarea").forEach((field) => {
            field.setCustomValidity("");
            setFieldError(field, "");
        });
    };

    const submitToFormspree = async (form, status, successMessage) => {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        status.textContent = "Sending your request...";

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: new FormData(form)
            });
            let result;

            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok || !result || result.ok !== true) {
                const errors = result && Array.isArray(result.errors)
                    ? result.errors.map((error) => error.message).filter(Boolean)
                    : [];
                status.textContent = errors.length
                    ? `We couldn't send your request: ${errors.join(" ")}`
                    : "We couldn't confirm that your request was received. Please try again.";
                return false;
            }

            form.reset();
            clearFieldFeedback(form);
            status.textContent = successMessage;
            return true;
        } catch {
            status.textContent = "We couldn't send your request. Check your internet connection and try again.";
            return false;
        } finally {
            submitButton.disabled = false;
        }
    };

    const quoteForm = document.getElementById("quote-form");
    if (quoteForm) {
        const quoteStatus = setFormFeedback(quoteForm);
        const dateField = quoteForm.elements.namedItem("date");
        dateField.min = localDate;

        const startingPrices = {
            residential: 350,
            office: 700,
            deep: 800,
            move: 750,
            carpet: 400,
            upholstery: 350,
            window: 300
        };

        quoteForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            quoteStatus.textContent = "";

            const formData = new FormData(quoteForm);
            const nameField = quoteForm.elements.namedItem("name");
            if (!validateText(nameField, 2, "Enter your name using at least 2 non-space characters.")) {
                return;
            }

            const phone = formData.get("phone").toString();
            if (!isValidPhone(phone)) {
                const phoneField = quoteForm.elements.namedItem("phone");
                phoneField.setCustomValidity("Enter a phone number with 7 to 15 digits.");
                phoneField.reportValidity();
                return;
            }

            const areaField = quoteForm.elements.namedItem("propertyArea");
            if (!validateText(areaField, 2, "Enter the property suburb or area.")) {
                return;
            }

            if (formData.get("date").toString() < localDate) {
                const dateField = quoteForm.elements.namedItem("date");
                dateField.setCustomValidity("Choose today or a future date.");
                dateField.reportValidity();
                return;
            }

            const service = quoteForm.elements.namedItem("service");
            const serviceName = service.selectedOptions[0].textContent;
            const startingPrice = startingPrices[formData.get("service").toString()];
            await submitToFormspree(
                quoteForm,
                quoteStatus,
                "Your quote request has been received. "
                    + `The published starting price for ${serviceName} is R${startingPrice}. `
                    + "The final quote depends on the property and requested work; date availability has not been checked."
            );
        });
    }

    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        const contactStatus = setFormFeedback(contactForm);

        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            contactStatus.textContent = "";

            const formData = new FormData(contactForm);
            const nameField = contactForm.elements.namedItem("name");
            if (!validateText(nameField, 2, "Enter your name using at least 2 non-space characters.")) {
                return;
            }

            const phone = formData.get("phone").toString();
            if (!isValidPhone(phone)) {
                const phoneField = contactForm.elements.namedItem("phone");
                phoneField.setCustomValidity("Enter a phone number with 7 to 15 digits.");
                phoneField.reportValidity();
                return;
            }

            const messageField = contactForm.elements.namedItem("message");
            if (!validateText(messageField, 20, "Enter a message with at least 20 non-space characters.")) {
                return;
            }

            await submitToFormspree(
                contactForm,
                contactStatus,
                "Your message has been received. Thank you for contacting BrightNest."
            );
        });
    }

    const shareButton = document.getElementById("share-page");
    const shareStatus = document.getElementById("share-status");

    if (shareButton && shareStatus) {
        shareButton.addEventListener("click", async () => {
            shareStatus.textContent = "";

            if (window.location.protocol !== "https:"
                && window.location.hostname !== "localhost"
                && window.location.hostname !== "127.0.0.1") {
                shareStatus.textContent = "failed to share page.";
                return;
            }

            const shareData = {
                title: document.title,
                text: "BrightNest Cleaning Services — cleaning services in Cape Town.",
                url: window.location.href
            };

            let shareFailed = false;

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    shareStatus.textContent = "Share options opened.";
                    return;
                } catch (error) {
                    if (error?.name === "AbortError") {
                        return;
                    }
                    shareFailed = true;
                }
            }

            if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    shareStatus.textContent = "Page link copied to the clipboard.";
                    return;
                } catch (error) {
                    shareStatus.textContent = "Could not copy the page link. Copy the address from your browser.";
                    return;
                }
            }

            shareStatus.textContent = shareFailed
                ? "Could not open share options. Copy the page address from your browser."
                : "Your browser does not support sharing. Copy the page address from your browser.";
        });
    }

    const serviceList = document.getElementById("service-list");
    const serviceSearch = document.getElementById("service-search");
    const serviceSort = document.getElementById("service-sort");
    const serviceResults = document.getElementById("service-results");

    if (serviceList && serviceSearch && serviceSort && serviceResults) {
        const services = Array.from(serviceList.querySelectorAll(".service-card")).map((card, index) => {
            const priceLine = Array.from(card.querySelectorAll("p"))
                .find((paragraph) => paragraph.textContent.includes("Starting Price:"));
            const priceText = priceLine?.textContent.match(/R\s?([\d,]+)/i)?.[1];
            const price = priceText ? Number(priceText.replace(/,/g, "")) : 0;

            return {
                card,
                index,
                name: card.querySelector("h2")?.textContent.trim() || "",
                searchText: card.textContent.toLocaleLowerCase(),
                price
            };
        });

        const updateServices = () => {
            const searchTerm = serviceSearch.value.trim().toLocaleLowerCase();
            const sortOrder = serviceSort.value;
            const matchingServices = services
                .filter((service) => service.searchText.includes(searchTerm))
                .sort((first, second) => {
                    if (sortOrder === "name") {
                        return first.name.localeCompare(second.name);
                    }
                    if (sortOrder === "price-low") {
                        return first.price - second.price || first.index - second.index;
                    }
                    if (sortOrder === "price-high") {
                        return second.price - first.price || first.index - second.index;
                    }
                    return first.index - second.index;
                });

            services.forEach((service) => service.card.remove());
            matchingServices.forEach((service) => serviceList.append(service.card));

            if (matchingServices.length === 0) {
                serviceResults.textContent = "No cleaning services match your search. Try another term.";
            } else if (searchTerm) {
                serviceResults.textContent = `Showing ${matchingServices.length} of ${services.length} cleaning services.`;
            } else {
                serviceResults.textContent = `Showing all ${services.length} cleaning services.`;
            }
        };

        serviceSearch.addEventListener("input", updateServices);
        serviceSort.addEventListener("change", updateServices);
        updateServices();
    }

    const faqList = document.querySelector(".faq-list");

    if (faqList) {
        faqList.querySelectorAll(".faq-question").forEach((question) => {
            const answerId = question.getAttribute("aria-controls");
            const answer = answerId ? document.getElementById(answerId) : null;
            const icon = question.querySelector(".faq-icon");

            if (answer) {
                answer.hidden = question.getAttribute("aria-expanded") !== "true";
            }

            question.addEventListener("click", () => {
                const isExpanded = question.getAttribute("aria-expanded") === "true";
                question.setAttribute("aria-expanded", String(!isExpanded));
                if (answer) {
                    answer.hidden = isExpanded;
                }
                if (icon) {
                    icon.textContent = isExpanded ? "+" : "−";
                }
            });
        });
    }

    const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));

    if (galleryItems.length > 0 && typeof HTMLDialogElement !== "undefined") {
        const dialog = document.createElement("dialog");
        dialog.className = "lightbox";
        dialog.setAttribute("aria-label", "Project image viewer");

        const image = document.createElement("img");
        image.className = "lightbox-image";

        const caption = document.createElement("p");
        caption.className = "lightbox-caption";
        caption.id = "lightbox-caption";
        image.setAttribute("aria-describedby", caption.id);

        const controls = document.createElement("div");
        controls.className = "lightbox-controls";

        const previousButton = document.createElement("button");
        previousButton.type = "button";
        previousButton.textContent = "Previous image";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next image";

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "lightbox-close";
        closeButton.textContent = "Close";

        controls.append(previousButton, nextButton, closeButton);
        dialog.append(image, caption, controls);
        document.body.append(dialog);

        let currentIndex = 0;
        let lastTrigger = null;

        const showImage = (index) => {
            currentIndex = (index + galleryItems.length) % galleryItems.length;
            const item = galleryItems[currentIndex];
            image.src = item.dataset.full || item.querySelector("img").src;
            image.alt = item.dataset.alt || item.querySelector("img").alt;
            caption.textContent = `${image.alt} (${currentIndex + 1} of ${galleryItems.length})`;
        };

        galleryItems.forEach((item, index) => {
            item.addEventListener("click", () => {
                lastTrigger = item;
                showImage(index);
                dialog.showModal();
                closeButton.focus();
            });
        });

        previousButton.addEventListener("click", () => showImage(currentIndex - 1));
        nextButton.addEventListener("click", () => showImage(currentIndex + 1));
        closeButton.addEventListener("click", () => dialog.close());
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) {
                dialog.close();
            }
        });
        dialog.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                showImage(currentIndex - 1);
            } else if (event.key === "ArrowRight") {
                showImage(currentIndex + 1);
            } else if (event.key === "Escape") {
                dialog.close();
            }
        });
        dialog.addEventListener("close", () => {
            if (lastTrigger) {
                lastTrigger.focus();
            }
        });
    }

    const mapElement = document.getElementById("business-map");
    const mapStatus = document.getElementById("map-status");

    if (mapElement && mapStatus) {
        if (typeof L === "undefined") {
            mapStatus.textContent = "The interactive map could not be loaded. Use the OpenStreetMap link below to view the service area.";
        } else {
            const capeTown = [-33.9249, 18.4241];
            const map = L.map(mapElement).setView(capeTown, 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            L.marker(capeTown)
                .addTo(map)
                .bindPopup("BrightNest Cleaning Services — Cape Town service area");

            map.on("tileerror", () => {
                mapStatus.textContent = "Map tiles could not be loaded. Use the OpenStreetMap link below to view the service area.";
            });
        }
    }

    const revealTargets = Array.from(document.querySelectorAll("main > section"))
        .filter((section) => !section.querySelector(".service-card"));

    if (revealTargets.length > 0
        && "IntersectionObserver" in window
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        revealTargets.forEach((target) => target.classList.add("reveal"));
        let observer = null;

        const startReveals = () => {
            if (document.visibilityState !== "visible" || observer) {
                return;
            }

            document.body.classList.add("reveal-ready");
            observer = new IntersectionObserver((entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        currentObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12 });

            revealTargets.forEach((target) => {
                if (!target.classList.contains("is-visible")) {
                    observer.observe(target);
                }
            });
        };

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                document.body.classList.remove("reveal-ready");
            } else {
                startReveals();
            }
        });

        startReveals();
    }
});
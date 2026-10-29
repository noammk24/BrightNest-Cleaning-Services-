document.addEventListener("DOMContentLoaded", () => {
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
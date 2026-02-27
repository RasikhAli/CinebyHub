
css_to_append = """

/* ═══════════════ FOOTER ═══════════════ */
.footer {
  margin-top: 5rem;
  padding: 4rem 1.5rem 3rem;
  background: var(--nav-bg);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(24px) saturate(180%);
  position: relative;
  z-index: 10;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.9;
}

.footer-links {
  display: flex;
  gap: 3rem;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  color: var(--text-2);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: all var(--t) var(--ease);
  position: relative;
}

.footer-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 0;
  height: 1.5px;
  background: var(--accent);
  transition: all var(--t) var(--ease);
  transform: translateX(-50%);
  border-radius: var(--radius-full);
}

.footer-link:hover {
  color: var(--accent);
  transform: translateY(-2px);
}

.footer-link:hover::after {
  width: 100%;
}

.footer-copy {
  color: var(--text-3);
  font-size: 0.82rem;
  text-align: center;
  max-width: 600px;
  line-height: 1.8;
  border-top: 1px solid var(--border);
  padding-top: 2rem;
  width: 100%;
}

.footer-copy a {
  color: var(--accent);
  font-weight: 600;
  transition: opacity var(--t);
}

.footer-copy a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .footer {
    margin-top: 3rem;
    padding: 3rem 1.5rem 2.5rem;
  }
  
  .footer-links {
    gap: 1.5rem;
  }
}
"""

with open(r"e:\zPythonStuff\1 - Linkvertise\watch-hub-cineby\style.css", "a", encoding="utf-8") as f:
    f.write(css_to_append)
print("Footer styles appended successfully.")

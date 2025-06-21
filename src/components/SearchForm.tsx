import { useEffect, useState, type FormEvent } from "react";
import { isValidUsername } from "../api/endpoints";

interface Props {
  initial: string;
  onSearch: (username: string) => void;
  busy?: boolean;
}

const EXAMPLES = ["octocat", "gaearon", "sindresorhus"];

export function SearchForm({ initial, onSearch, busy = false }: Props) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  // Follow back/forward navigation that changes the user from outside.
  useEffect(() => setValue(initial), [initial]);

  function submit(name: string) {
    const trimmed = name.trim().replace(/^@/, "");
    if (!isValidUsername(trimmed)) {
      setError(
        trimmed === ""
          ? "Enter a GitHub username."
          : "That is not a valid GitHub username (letters, numbers and single hyphens, up to 39 characters).",
      );
      return;
    }
    setError("");
    setValue(trimmed);
    onSearch(trimmed);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(value);
  }

  return (
    <form className="search" role="search" onSubmit={handleSubmit} noValidate>
      <label htmlFor="username" className="search-label">
        GitHub username
      </label>
      <div className="search-row">
        <span className="search-at" aria-hidden="true">
          @
        </span>
        <input
          id="username"
          name="username"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="octocat"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "username-error" : undefined}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Loading" : "Analyze"}
        </button>
      </div>
      {error && (
        <p id="username-error" className="search-error" role="alert">
          {error}
        </p>
      )}
      <p className="search-examples">
        Try:{" "}
        {EXAMPLES.map((name) => (
          <button key={name} type="button" className="link-button" onClick={() => submit(name)}>
            {name}
          </button>
        ))}
      </p>
    </form>
  );
}

import { useState } from "react";
import { aiApi, menuApi } from "../api/endpoints";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import { TextField } from "../components/Field";
import { useNetwork } from "../context/NetworkStatusContext";
import { getErrorMessage } from "../utils/errors";

const MAX = 200;
const IDEAS = ["Something sweet and iced", "A strong coffee to wake me up", "Plant-based and refreshing", "A light pastry for breakfast"];

// Fallback when the AI is unavailable: try the longer words of the question as ordinary menu searches.
async function keywordSearch(text) {
  const words = [...new Set(text.toLowerCase().split(/\W+/).filter((w) => w.length > 3))].slice(0, 3);
  for (const word of words) {
    const { data } = await menuApi.products({ search: word, limit: 6 });
    if (data.length) return data;
  }
  return (await menuApi.products({ bestSeller: "true", limit: 4 })).data;
}

export default function AiAssistant() {
  const { online } = useNetwork();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { mode: "ai" | "search", summary, products }
  const [error, setError] = useState(null);

  const ask = async (text) => {
    const q = text.trim();
    if (q.length < 3) { setError({ message: "Tell me a little more (at least 3 characters)." }); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await aiApi.recommend(q);
      setResult({ mode: "ai", summary: data.summary, disclaimer: data.disclaimer, products: data.products });
    } catch (err) {
      if (err.code === "AI_UNAVAILABLE") {
        // 503 -> graceful fallback to normal keyword search
        try {
          const products = await keywordSearch(q);
          setResult({ mode: "search", summary: "The AI assistant is resting, so here are menu matches for your words.", products });
        } catch (e2) { setError(e2); }
      } else setError(err);
    } finally { setLoading(false); }
  };

  const onSubmit = (e) => { e.preventDefault(); if (!loading && online) ask(query); };

  return (
    <main className="page">
      <PageHeader title="AI assistant" subtitle="Find your next favorite" back />
      <form onSubmit={onSubmit} className="card stack" noValidate>
        <TextField
          as="textarea" rows={3} label="What are you craving?" value={query} maxLength={MAX} disabled={!online}
          onChange={(e) => setQuery(e.target.value)} placeholder="e.g. something cold and not too sweet" hint={`${query.length}/${MAX}`}
        />
        <ul className="chips chips--scroll" aria-label="Ideas">
          {IDEAS.map((idea) => <li key={idea}><button type="button" className="chip" disabled={!online} onClick={() => { setQuery(idea); ask(idea); }}>{idea}</button></li>)}
        </ul>
        {!online && <small className="muted">The assistant needs an internet connection.</small>}
        <button type="submit" className="btn btn--primary btn--block" disabled={loading || !online} title={online ? undefined : "Reconnect to use the assistant"}>
          <Icon name="sparkle" size={20} /> {loading ? "Thinking..." : "Suggest something"}
        </button>
      </form>

      {error && <ErrorAlert error={error.status !== undefined ? error : undefined} message={error.status === undefined ? error.message : getErrorMessage(error)} />}

      {result && (
        <section aria-live="polite" className="section">
          <div className="row row--between">
            <span className={`badge ${result.mode === "ai" ? "badge--info" : ""}`}>{result.mode === "ai" ? "AI-Assisted" : "Menu search"}</span>
          </div>
          <p>{result.summary}</p>
          {result.products.length > 0 && <div className="product-grid">{result.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
          {result.disclaimer && <small className="muted">{result.disclaimer}</small>}
        </section>
      )}
    </main>
  );
}

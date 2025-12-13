import { useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const MermaidViewer = dynamic(() => import('@/components/MermaidViewer'), { ssr: false });

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [repoShape, setRepoShape] = useState<any>(null);
  const [diagram, setDiagram] = useState('');
  const [summary, setSummary] = useState('');
  const [ciGenerated, setCiGenerated] = useState(false);
  const [prLink, setPrLink] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<string[]>([]);

  const addProgress = (msg: string) => {
    setProgress((prev) => [...prev, `✓ ${msg}`]);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProgress([]);
    setLoading(true);

    try {
      addProgress('Initiating repo analysis...');
      const response = await axios.post('/api/analyze', { repoUrl });

      setRepoShape(response.data.repoShape);
      setDiagram(response.data.diagram);
      setSummary(response.data.summary || '');
      addProgress('Repo analyzed successfully');
      addProgress('Diagram generated');
      if (response.data.summary) addProgress('Summary generated');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCI = async () => {
    if (!repoShape) {
      setError('Please analyze a repo first');
      return;
    }

    setLoading(true);
    try {
      addProgress('Generating CI pipeline...');
      const response = await axios.post('/api/generate-ci', { repoShape });

      if (response.data.prLink) {
        setPrLink(response.data.prLink);
        setCiGenerated(true);
        addProgress('CI generated and PR opened');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setError(`CI Generation failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">
            🏗️ RepoArchitectAgent
          </h1>
          <p className="text-xl text-slate-300">
            Automatically analyze GitHub repos and generate CI/CD pipelines
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleAnalyze}
              className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Analyze Repo</h2>

              <div className="mb-6">
                <label className="block text-slate-300 font-semibold mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 rounded transition duration-200"
              >
                {loading ? 'Analyzing...' : 'Analyze Repository'}
              </button>

              {repoShape && (
                <button
                  type="button"
                  onClick={handleGenerateCI}
                  disabled={loading}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 rounded transition duration-200"
                >
                  {loading ? 'Generating...' : 'Generate CI & Open PR'}
                </button>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}
            </form>

            {/* Progress Steps */}
            {progress.length > 0 && (
              <div className="mt-6 bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Progress</h3>
                <ul className="space-y-2">
                  {progress.map((step, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start">
                      <span className="mr-2 text-green-400">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* PR Link */}
            {prLink && (
              <div className="mt-6 bg-slate-800 rounded-lg shadow-lg p-6 border border-green-700">
                <h3 className="text-lg font-bold text-white mb-2">PR Created!</h3>
                <a
                  href={prLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {prLink}
                </a>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Repo Shape JSON */}
            {repoShape && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Repository Shape</h3>
                <pre className="bg-slate-900 p-4 rounded overflow-x-auto text-slate-300 text-xs">
                  {JSON.stringify(repoShape, null, 2)}
                </pre>
              </div>
            )}

            {/* Diagram */}
            {diagram && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Architecture Diagram</h3>
                <MermaidViewer diagram={diagram} />
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">AI Summary</h3>
                <div className="text-slate-300 space-y-4 whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


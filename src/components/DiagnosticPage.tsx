import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const DiagnosticPage = () => {
    const [checks, setChecks] = useState({
        firebaseConfig: false,
        authInstance: false,
        firestoreInstance: false,
        emailProvider: false,
        googleProvider: false,
        anonymousProvider: false,
    });
    const [loading, setLoading] = useState(true);
    const [testEmail] = useState('test@example.com');
    const [testPassword] = useState('test123456');
    const [testResults, setTestResults] = useState<any[]>([]);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        setLoading(true);
        const results: any = {};

        // Check Firebase config
        results.firebaseConfig = !!(
            import.meta.env.VITE_FIREBASE_API_KEY &&
            import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
            import.meta.env.VITE_FIREBASE_PROJECT_ID
        );

        // Check Auth instance
        results.authInstance = !!auth;

        // Check Firestore instance
        results.firestoreInstance = !!db;

        // Check providers (these will show as true if SDK is loaded)
        results.emailProvider = true;
        results.googleProvider = true;
        results.anonymousProvider = true;

        setChecks(results);
        setLoading(false);
    };

    const testEmailLogin = async () => {
        const result: any = { method: 'Email/Password', status: 'testing', error: null };
        setTestResults(prev => [...prev, result]);

        try {
            await signInWithEmailAndPassword(auth, testEmail, testPassword);
            result.status = 'success';
            result.message = 'Login successful';
        } catch (error: any) {
            result.status = 'error';
            result.error = error.code;
            result.message = error.message;
        }

        setTestResults(prev => prev.map(r => r === result ? { ...result } : r));
    };

    const testEmailRegister = async () => {
        const result: any = { method: 'Email Registration', status: 'testing', error: null };
        setTestResults(prev => [...prev, result]);

        try {
            await createUserWithEmailAndPassword(auth, `test${Date.now()}@example.com`, testPassword);
            result.status = 'success';
            result.message = 'Registration successful';
        } catch (error: any) {
            result.status = 'error';
            result.error = error.code;
            result.message = error.message;
        }

        setTestResults(prev => prev.map(r => r === result ? { ...result } : r));
    };

    const testGoogleLogin = async () => {
        const result: any = { method: 'Google', status: 'testing', error: null };
        setTestResults(prev => [...prev, result]);

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            result.status = 'success';
            result.message = 'Google login successful';
        } catch (error: any) {
            result.status = 'error';
            result.error = error.code;
            result.message = error.message;
        }

        setTestResults(prev => prev.map(r => r === result ? { ...result } : r));
    };

    const testAnonymousLogin = async () => {
        const result: any = { method: 'Anonymous', status: 'testing', error: null };
        setTestResults(prev => [...prev, result]);

        try {
            await signInAnonymously(auth);
            result.status = 'success';
            result.message = 'Anonymous login successful';
        } catch (error: any) {
            result.status = 'error';
            result.error = error.code;
            result.message = error.message;
        }

        setTestResults(prev => prev.map(r => r === result ? { ...result } : r));
    };

    const StatusIcon = ({ status }: { status: boolean }) => {
        if (loading) return <Loader2 className="animate-spin text-blue-400" size={20} />;
        return status ? 
            <CheckCircle2 className="text-green-400" size={20} /> : 
            <XCircle className="text-red-400" size={20} />;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">Firebase Authentication Diagnostics</h1>
                <p className="text-white/50 mb-8">检查 Firebase 配置和登录功能状态</p>

                {/* Configuration Checks */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">配置检查</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span>Firebase 配置</span>
                            <StatusIcon status={checks.firebaseConfig} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Auth 实例</span>
                            <StatusIcon status={checks.authInstance} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Firestore 实例</span>
                            <StatusIcon status={checks.firestoreInstance} />
                        </div>
                    </div>
                </div>

                {/* Environment Variables */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">环境变量</h2>
                    <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between">
                            <span className="text-white/50">VITE_FIREBASE_API_KEY:</span>
                            <span>{import.meta.env.VITE_FIREBASE_API_KEY ? '✅ 已设置' : '❌ 未设置'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">VITE_FIREBASE_AUTH_DOMAIN:</span>
                            <span>{import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ 未设置'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">VITE_FIREBASE_PROJECT_ID:</span>
                            <span>{import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ 未设置'}</span>
                        </div>
                    </div>
                </div>

                {/* Test Buttons */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">测试登录功能</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={testEmailLogin}
                            className="py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                            测试邮箱登录
                        </button>
                        <button
                            onClick={testEmailRegister}
                            className="py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition"
                        >
                            测试邮箱注册
                        </button>
                        <button
                            onClick={testGoogleLogin}
                            className="py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg transition"
                        >
                            测试 Google 登录
                        </button>
                        <button
                            onClick={testAnonymousLogin}
                            className="py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                        >
                            测试匿名登录
                        </button>
                    </div>
                </div>

                {/* Test Results */}
                {testResults.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">测试结果</h2>
                        <div className="space-y-3">
                            {testResults.map((result, idx) => (
                                <div key={idx} className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">{result.method}</span>
                                        {result.status === 'testing' && <Loader2 className="animate-spin text-blue-400" size={18} />}
                                        {result.status === 'success' && <CheckCircle2 className="text-green-400" size={18} />}
                                        {result.status === 'error' && <XCircle className="text-red-400" size={18} />}
                                    </div>
                                    {result.message && (
                                        <p className={`text-sm ${result.status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                            {result.message}
                                        </p>
                                    )}
                                    {result.error && (
                                        <p className="text-xs text-white/50 mt-1 font-mono">{result.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mt-6">
                    <div className="flex gap-3">
                        <AlertCircle className="text-yellow-400 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-semibold text-yellow-400 mb-2">常见问题解决方案</h3>
                            <ul className="text-sm text-white/70 space-y-2">
                                <li>• 如果配置检查失败：检查 .env 文件是否存在且配置正确</li>
                                <li>• 如果看到 "auth/operation-not-allowed"：在 Firebase Console 中启用对应的登录方式</li>
                                <li>• 如果看到 "auth/unauthorized-domain"：在 Firebase Console 添加当前域名到授权域名列表</li>
                                <li>• 如果看到 "auth/user-not-found"：用户不存在，请先注册</li>
                                <li>• 如果看到 "auth/wrong-password"：密码错误</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiagnosticPage;

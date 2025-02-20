import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 18, marginBottom: 20 }}>
                        Something went wrong. Please try again.
                    </Text>
                    <TouchableOpacity
                        onPress={() => this.setState({ hasError: false, error: null })}
                        style={{ padding: 10, backgroundColor: '#000', borderRadius: 5 }}
                    >
                        <Text style={{ color: '#fff' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
} 
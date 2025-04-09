import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  padding: 16px;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);

  .ant-card-body {
    padding: 32px;
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    color: #1a365d;
    font-size: 28px;
    font-weight: bold;
    margin: 0;
  }
  
  p {
    color: #4a5568;
    margin-top: 8px;
    font-size: 16px;
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  height: 45px;
  font-size: 16px;
  border-radius: 8px;
  background: #1a365d;
  border-color: #1a365d;
  
  &:hover, &:focus {
    background: #2d3748;
    border-color: #2d3748;
  }
`;

const StyledInput = styled(Input)`
  height: 45px;
  border-radius: 8px;
  font-size: 16px;
  
  .ant-input-prefix {
    margin-right: 12px;
    color: #4a5568;
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Login attempt with:', { email });
      await login(email, password);
      console.log('Login successful, navigating to /');
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      message.error(err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <StyledCard>
        <Logo>
          <h1>NanoERP</h1>
          <p>Mobil Yönetim Paneli</p>
        </Logo>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <StyledInput
              prefix={<UserOutlined />}
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              type="email"
              autoComplete="email"
            />
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <StyledInput.Password
              prefix={<LockOutlined />}
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
          </div>

          <StyledButton
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </StyledButton>
        </form>
      </StyledCard>
    </LoginContainer>
  );
};

export default Login; 
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      address: '',
      age: '',
      birthday: '',
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        profile: {
          address: user.profile?.address || '',
          age: user.profile?.age || '',
          birthday: user.profile?.birthday || '',
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.profile) {
      setFormData((prev) => ({
        ...prev,
        profile: { ...prev.profile, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault()
    try {
      await updateUser(formData)
      setIsEditing(false)
      setConfirmSave(false)
    } catch (error) {
      console.error('Failed to update profile', error)
    }
  };

  const renderField = (label, name, value, type = 'text') => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      {isEditing ? (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
        />
      ) : (
        <p>{value || 'Not set'}</p>
      )}
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>User Profile</h2>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {renderField('First Name', 'first_name', formData.first_name)}
          {renderField('Last Name', 'last_name', formData.last_name)}
          {renderField('Email', 'email', formData.email, 'email')}
          {renderField('Address', 'address', formData.profile.address)}
          {renderField('Age', 'age', formData.profile.age, 'number')}
          {renderField('Birthday', 'birthday', formData.profile.birthday, 'date')}
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setIsEditing(false); setConfirmSave(false); }}
            >
              Cancel
            </button>

            {!confirmSave ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setConfirmSave(true)}
              >
                Save Changes
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>
                  Save changes now?
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  Yes
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setConfirmSave(false)}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;

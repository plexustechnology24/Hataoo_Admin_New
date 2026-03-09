import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';

// assets
import logoDark from "../../assest/logo.png";
import login from "../../assest/bg.png";
import FullPageLoader from '../../components/FullPageLoader';

// ==============================|| SIGN IN 1 ||============================== //

const SignIn = () => {
  const [loading, setLoading] = useState(false); // State to control the loader display
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="bg-[#EFF3FF] p-10 h-screen flex items-center justify-center">
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-lg w-full h-full flex flex-col md:flex-row">
        {/* Left Side - Login Form */}
        <div className="md:w-1/2">
          <img src={logoDark} alt="Logo" className="mb-15 w-32" />
          <div className='login mx-auto'>
            <h4 className="text-left text-2xl ps-6 font-bold">Login</h4>
            <div className="bg-white p-6 rounded-lg">
              <Formik
                initialValues={{
                  email: '',
                  pass: '',
                  submit: null
                }}
                validationSchema={Yup.object().shape({
                  email: Yup.string().email('Must be a valid email').required('Email is required'),
                  pass: Yup.string().required('Password is required')
                })}
                onSubmit={async (values, { setErrors, setSubmitting }) => {
                  setLoading(true);
                  try {
                    const response = await axios.post('https://api.hataoo.in/api/admin/login', {
                      email: values.email,
                      password: values.pass
                    });

                    const { token } = response.data;
                    console.log(token);

                    localStorage.setItem('adminToken', token);
                    navigate('/');
                  } catch (error) {
                    console.error(error);
                    setErrors({ submit: 'Invalid email or password' });
                  }
                  setLoading(false);
                  setSubmitting(false);
                }}
              >
                {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                  <form noValidate onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-1 text-left">Enter Email:</label>
                      <input
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        name="email"
                        placeholder="Enter Your Email"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        type="email"
                        value={values.email}
                      />
                      {touched.email && errors.email && <small className="text-red-500 text-left">{errors.email}</small>}
                    </div>

                    {/* Password Field */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-1 text-left">Enter Password:</label>
                      <div className="relative">
                        <input
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                          name="pass"
                          placeholder="Enter Password"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          type={showPassword ? 'text' : 'password'}
                          value={values.pass}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {showPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                        </button>
                      </div>
                      {touched.pass && errors.pass && <small className="text-red-500 text-left">{errors.pass}</small>}
                    </div>

                    {/* Submit Button */}
                    {errors.submit && (
                      <div className="text-red-500 bg-red-100 p-2 rounded-md mb-4">
                        {errors.submit}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-black font-semibold py-2 rounded-lg transition"
                      style={{
                        background: 'linear-gradient(90deg, #eab308 0%, #eab308 100%)'
                      }}
                    >
                      {isSubmitting ? "Signing In..." : "Sign In"}
                    </button>


                    {loading && <FullPageLoader />}
                  </form>
                )}
              </Formik>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center rounded-lg">
          <img src={login} alt="Login" className="max-w-lg" />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
